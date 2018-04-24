let __webpack_public_path__;
import { Component, ReactElement, createElement } from "react";

import { Alert, AlertProps } from "../../components/Alert";
import { BarChart, BarChartProps } from "./BarChart";
import { fetchSeriesData, getSeriesTraces, handleOnClick, validateSeriesProps } from "../../utils/data";
import deepMerge from "deepmerge";
import { Container, Data } from "../../utils/namespaces";
import { ScatterData } from "plotly.js";
import { defaultColours, getDimensions, parseStyle } from "../../utils/style";
import BarChartContainerProps = Container.BarChartContainerProps;
import BarChartContainerState = Container.BarChartContainerState;
import { fetchThemeConfigs } from "../../utils/configs";

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

export default class BarChartContainer extends Component<BarChartContainerProps, BarChartContainerState> {
    static defaultProps: Partial<BarChartContainerProps> = { orientation: "bar" };
    state: BarChartContainerState = {
        alertMessage: validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions),
        data: [],
        seriesOptions: [],
        loading: true,
        themeConfigs: { layout: {}, configuration: {}, data: {} }
    };
    private subscriptionHandle?: number;
    private intervalID?: number;

    render() {
        return createElement("div",
            {
                style: this.state.loading
                    ? { ...getDimensions(this.props), ...parseStyle(this.props.style) }
                    : undefined
            },
            createElement(BarChart, {
                ...this.props as BarChartContainerProps,
                series: this.state.data ? this.state.data.map(({ series }) => series) : this.props.series,
                scatterData: this.state.scatterData,
                seriesOptions: this.state.seriesOptions,
                loading: this.state.loading,
                alertMessage: this.state.alertMessage,
                themeConfigs: this.state.themeConfigs,
                onClick: handleOnClick,
                onHover: BarChartContainer.openTooltipForm
            })
        );
    }

    componentDidMount() {
        if (this.props.devMode !== "basic") {
            fetchThemeConfigs(this.props.orientation === "bar" ? "BarChart" : "ColumnChart")
                .then(themeConfigs => this.setState({ themeConfigs }));
        }
    }

    componentWillReceiveProps(newProps: BarChartContainerProps) {
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
        this.componentWillUnmount();
        if (mxObject) {
            this.subscriptionHandle = mx.data.subscribe({
                callback: () => this.fetchData(mxObject),
                guid: mxObject.getGuid()
            });
        }
    }

    private fetchData = (mxObject?: mendix.lib.MxObject) => {
        if (mxObject && this.props.series.length) {
            Promise.all(this.props.series.map(series => fetchSeriesData(mxObject, series)))
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

    private getData(seriesData: Data.SeriesData[]): ScatterData[] {
        return seriesData.map((data, index) =>
            this.createScatterData(data, this.props.orientation === "bar", index, this.props.devMode !== "basic")
        );
    }

    private createScatterData({ data, series }: Data.SeriesData, bar: boolean, index: number, devMode = false): ScatterData {
        const rawOptions = devMode && series.seriesOptions ? JSON.parse(series.seriesOptions) : {};
        const traces = getSeriesTraces({ data, series });
        const color: string | undefined = series.barColor || defaultColours()[index];

        return {
            ...deepMerge.all<ScatterData>([
                BarChart.getDefaultSeriesOptions(series, this.props as BarChartProps),
                {
                    x: bar ? traces.y : traces.x,
                    y: bar ? traces.x : traces.y,
                    series, // shall be accessible via the data property of a hover/click point
                    marker: color ? { color } : {}
                },
                rawOptions
            ]),
            customdata: data // each array element shall be returned as the custom data of a corresponding point
        };
    }

    public static openTooltipForm(domNode: HTMLDivElement, tooltipForm: string, dataObject: mendix.lib.MxObject) {
        const context = new mendix.lib.MxContext();
        context.setContext(dataObject.getEntity(), dataObject.getGuid());
        while (domNode.firstChild) {
            domNode.removeChild(domNode.firstChild);
        }
        window.mx.ui.openForm(tooltipForm, { domNode, context });
    }
}
