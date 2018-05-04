let __webpack_public_path__: string;
import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";
import { Component, createElement } from "react";
import { fetchThemeConfigs } from "../../utils/configs";
import { fetchData, generateRESTURL, getSeriesTraces, handleOnClick, openTooltipForm, validateSeriesProps } from "../../utils/data";
import { Container, Data } from "../../utils/namespaces";
import { defaultColours, fillColours, getDimensions, parseStyle } from "../../utils/style";
import { LineChart, LineChartProps } from "./LineChart";

import LineChartContainerProps = Container.LineChartContainerProps;
import LineChartContainerState = Container.LineChartContainerState;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

export default class LineChartContainer extends Component<LineChartContainerProps, LineChartContainerState> {
    static defaultProps: Partial<LineChartContainerProps> = { fill: false, type: "line" };
    state: LineChartContainerState = {
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
            createElement(LineChart, {
                ...this.props as LineChartContainerProps,
                series: this.state.data ? this.state.data.map(({ series }) => series) : this.props.series,
                scatterData: this.state.scatterData,
                seriesOptions: this.state.seriesOptions,
                themeConfigs: this.state.themeConfigs,
                loading: this.state.loading,
                alertMessage: this.state.alertMessage,
                onClick: this.handleOnClick,
                onHover: this.handleOnHover
            })
        );
    }

    componentDidMount() {
        if (this.props.devMode !== "basic") {
            if (this.props.type === "line") {
                fetchThemeConfigs("LineChart").then(themeConfigs => this.setState({ themeConfigs }));
            } else if (this.props.type === "bubble") {
                fetchThemeConfigs("BubbleChart").then(themeConfigs => this.setState({ themeConfigs }));
            } else if (this.props.type === "area") {
                fetchThemeConfigs("AreaChart").then(themeConfigs => this.setState({ themeConfigs }));
            } else if (this.props.type === "polar") {
                fetchThemeConfigs("PolarChart").then(themeConfigs => this.setState({ themeConfigs }));
            } else if (this.props.type === "timeseries") {
                fetchThemeConfigs("TimeSeries").then(themeConfigs => this.setState({ themeConfigs }));
            }
        }
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
            Promise.all(this.props.series.map(series => {
                const attributes = [ series.xValueAttribute, series.yValueAttribute ];
                if (series.xValueSortAttribute) {
                    attributes.push(series.xValueSortAttribute);
                }
                if (this.props.type === "bubble" && series.markerSizeAttribute) {
                    attributes.push(series.markerSizeAttribute);
                }
                const url = series.restUrl && generateRESTURL(mxObject, series.restUrl, this.props.restParameters);

                return fetchData<Data.LineSeriesProps>({
                    guid: mxObject.getGuid(),
                    entity: series.dataEntity,
                    constraint: series.entityConstraint,
                    sortAttribute: series.xValueSortAttribute,
                    sortOrder: series.sortOrder,
                    type: series.dataSourceType,
                    attributes,
                    microflow: series.dataSourceMicroflow,
                    url: url && `${url}&seriesName=${series.name}`,
                    customData: series
                });
            })).then(seriesData => {
                const data = seriesData.map(({ mxObjects, restData, customData }) => ({
                    data: mxObjects,
                    restData,
                    series: customData as Data.LineSeriesProps
                }));
                this.setState({
                    loading: false,
                    data,
                    scatterData: this.getData(data),
                    seriesOptions: data.map(({ series }) => series.seriesOptions || "{\n\n}")
                });
            }).catch(error => {
                window.mx.ui.error(`Error in ${this.props.friendlyId} ${error.customData.name}:\n${error.message}`);
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

    private createScatterData({ data, restData, series }: Data.SeriesData<Data.LineSeriesProps>, index: number, devMode = false): ScatterData {
        const rawOptions = devMode && series.seriesOptions ? JSON.parse(series.seriesOptions) : {};
        const color: string | undefined = series.lineColor || defaultColours(this.props.type === "bubble" ? 0.7 : 1)[index];
        let traces = getSeriesTraces({ data, restData, series });
        if (this.props.type === "polar") {
            traces = {
                r: (traces.y as number[]).concat(traces.y[0] as number),
                theta: traces.x.concat(traces.x[0])
            } as Data.ScatterTrace;
        }

        return {
            ...deepMerge.all<ScatterData>([
                LineChart.getDefaultSeriesOptions(series, this.props as LineChartProps),
                {
                    series, // shall be accessible via the data property of a hover/click point
                    fillcolor: series.fillColor || (!series.lineColor ? fillColours[index] : undefined),
                    line: color ? { color } : {},
                    marker: color ? { color } : {},
                    text: traces.marker ? traces.marker.size : "", // show the size value on hover,
                    mode: this.props.type === "bubble" ? "markers" : series.mode
                },
                traces,
                rawOptions
            ]),
            customdata: data || [] // each array element shall be returned as the custom data of a corresponding point
        };
    }

    private handleOnClick = (options: Data.OnClickOptions<{ x: string, y: number, size: number }, Data.LineSeriesProps>) => {
        if (options.mxObject) {
            handleOnClick(options.options, options.mxObject, options.mxForm);
        } else if (options.trace) {
            this.createDataPoint(options.options, options.trace)
                .then(mxObject => handleOnClick(options.options, mxObject, options.mxForm))
                .catch(error => mx.ui.error(`An error occured while creating ${options.options.dataEntity} object: ${error}`));
        }
    }

    private handleOnHover = (options: Data.OnHoverOptions<{ x: string, y: number, size: number }, Data.LineSeriesProps>) => {
        if (options.mxObject) {
            openTooltipForm(options.tooltipNode, options.tooltipForm, options.mxObject);
        } else if (options.trace && options.options.dataEntity) {
            this.createDataPoint(options.options, options.trace)
                .then(mxObject => openTooltipForm(options.tooltipNode, options.tooltipForm, mxObject))
                .catch(error => mx.ui.error(`An error occured while creating ${options.options.dataEntity} object: ${error}`));
        }
    }

    private createDataPoint(seriesProps: Data.LineSeriesProps, trace: { x: string, y: number, size: number }) {
        return new Promise<mendix.lib.MxObject>((resolve, reject) => {
            window.mx.data.create({
                entity: seriesProps.dataEntity,
                callback: mxObject => {
                    mxObject.set(seriesProps.xValueAttribute, trace.x);
                    mxObject.set(seriesProps.yValueAttribute, trace.y);
                    if (this.props.type === "bubble" && seriesProps.markerSizeAttribute) {
                        mxObject.set(seriesProps.markerSizeAttribute, trace.size);
                    }
                    resolve(mxObject);
                },
                error: error => reject(error.message)
            });
        });
    }
}

export { __webpack_public_path__ };
