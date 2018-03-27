let __webpack_public_path__;
import { Component, createElement } from "react";

import BarChartContainer from "../../BarChart/components/BarChartContainer";
import deepMerge from "deepmerge";
import { fetchSeriesData, getSeriesTraces, handleOnClick, validateSeriesProps } from "../../utils/data";
import { LineChart } from "./LineChart";
import { Container, Data } from "../../utils/namespaces";
import { ScatterData } from "plotly.js";
import { defaultColours, fillColours, getDimensions, parseStyle } from "../../utils/style";
import LineChartContainerProps = Container.LineChartContainerProps;
import LineChartContainerState = Container.LineChartContainerState;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

export default class LineChartContainer extends Component<LineChartContainerProps, LineChartContainerState> {
    static defaultProps: Partial<LineChartContainerProps> = { fill: false };
    state: LineChartContainerState = {
        alertMessage: validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions),
        data: [],
        seriesOptions: [],
        loading: true
    };
    private subscriptionHandle?: number;
    private intervalID?: number;
    private markerSize?: number[];

    render() {
        return createElement("div",
            {
                style: this.state.loading
                    ? { ...getDimensions(this.props), ...parseStyle(this.props.style) }
                    : undefined
            },
            createElement(LineChart, {
                ...this.props as LineChartContainerProps,
                series: this.state.data ? this.state.data.map(({ series }) => series) : this.props.series,
                scatterData: this.state.scatterData,
                seriesOptions: this.state.seriesOptions,
                loading: this.state.loading,
                alertMessage: this.state.alertMessage,
                onClick: handleOnClick,
                onHover: BarChartContainer.openTooltipForm
            })
        );
    }

    componentWillReceiveProps(newProps: LineChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        if (!this.state.loading) {
            this.setState({ loading: true });
        }
        if (!this.state.alertMessage) {
            this.fetchData(newProps.mxObject);
            this.setRefreshInterval(newProps.refreshInterval, newProps.mxObject);
        }
    }

    componentWillUnmount() {
        if (this.subscriptionHandle) {
            mx.data.unsubscribe(this.subscriptionHandle);
        }
        this.clearRefreshInterval();
    }

    private setRefreshInterval(refreshInterval: number, mxObject?: mendix.lib.MxObject) {
        if (refreshInterval > 0 && mxObject) {
            this.clearRefreshInterval();
            this.intervalID = window.setInterval(() => {
                if (!this.state.loading) {
                    this.fetchData(mxObject);
                }
            }, refreshInterval);
        }
    }

    private clearRefreshInterval() {
        if (this.intervalID) {
            window.clearInterval(this.intervalID);
        }
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        if (this.subscriptionHandle) {
            mx.data.unsubscribe(this.subscriptionHandle);
        }
        if (mxObject) {
            this.subscriptionHandle = mx.data.subscribe({
                callback: () => this.fetchData(mxObject),
                guid: mxObject.getGuid()
            });
        }
    }

    private fetchData = (mxObject?: mendix.lib.MxObject) => {
        if (mxObject && this.props.series.length) {
            Promise.all(this.props.series.map(series => fetchSeriesData<Data.LineSeriesProps>(mxObject, series)))
                .then(seriesData => {
                    this.setState({
                        loading: false,
                        data: seriesData,
                        scatterData: this.getData(seriesData),
                        seriesOptions: seriesData.map(({ series }) => series.seriesOptions || "{\n\n}")
                    });
                })
                .catch(reason => {
                    window.mx.ui.error(reason);
                    this.setState({ loading: false, data: [], scatterData: [] });
                });
        } else {
            this.setState({ loading: false, data: [], scatterData: [] });
        }
    }

    private getData(seriesData: Data.SeriesData<Data.LineSeriesProps>[]): ScatterData[] {
        return seriesData.map((data, index) =>
            this.createScatterData(data, index, this.props.devMode !== "basic")
        );
    }

    private createScatterData({ data, series }: Data.SeriesData<Data.LineSeriesProps>, index: number, devMode = false): ScatterData {
        const rawOptions = devMode && series.seriesOptions ? JSON.parse(series.seriesOptions) : {};
        const color: string | undefined = series.lineColor || defaultColours(series.mode === ("bubble" as any) ? 0.7 : 1)[index];
        let traces = getSeriesTraces({ data, series });
        if (this.props.type === "polar") {
            traces = {
                r: (traces.y as number[]).concat(traces.y[0] as number),
                theta: traces.x.concat(traces.x[0])
            } as Data.ScatterTrace;
        }

        return {
            ...deepMerge.all<ScatterData>([
                LineChart.getDefaultSeriesOptions(series, this.props),
                {
                    series, // shall be accessible via the data property of a hover/click point
                    fillcolor: series.fillColor || (!series.lineColor ? fillColours[index] : undefined),
                    line: color ? { color } : {},
                    marker: color ? { color } : {},
                    text: traces.marker ? traces.marker.size : "", // show the size value on hover,
                    mode: series.mode === ("bubble" as any) ? "markers" : series.mode
                },
                traces,
                rawOptions
            ]),
            customdata: data // each array element shall be returned as the custom data of a corresponding point
        };
    }
}
