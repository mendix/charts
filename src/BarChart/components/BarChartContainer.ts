let __webpack_public_path__: string;
import { Component, createElement } from "react";

import { BarChart, BarChartProps } from "./BarChart";
import { fetchData, generateRESTURL, getSeriesTraces, handleOnClick, openTooltipForm, validateSeriesProps } from "../../utils/data";
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
    private subscriptionHandles: number[] = [];
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
                onClick: this.handleOnClick,
                onHover: this.handleOnHover
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
        this.unsubscribe();
    }

    private unsubscribe() {
        this.subscriptionHandles.map(handle => mx.data.unsubscribe(handle));
        this.subscriptionHandles = [];
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
        this.unsubscribe();
        if (mxObject) {
            this.subscriptionHandles.push(mx.data.subscribe({
                callback: () => this.fetchData(mxObject),
                guid: mxObject.getGuid()
            }));
        }
    }

    private fetchData = (mxObject?: mendix.lib.MxObject) => {
        if (mxObject && this.props.series.length) {
            Promise.all(this.props.series.map(series => {
                const attributes = [ series.xValueAttribute, series.yValueAttribute ];
                if (series.xValueSortAttribute) {
                    attributes.push(series.xValueSortAttribute);
                }
                const url = series.restUrl && generateRESTURL(mxObject, series.restUrl, this.props.restParameters);

                return fetchData<Data.SeriesProps>({
                    guid: mxObject.getGuid(),
                    entity: series.dataEntity,
                    constraint: series.entityConstraint,
                    sortAttribute: series.xValueSortAttribute || series.xValueAttribute,
                    sortOrder: series.sortOrder,
                    type: series.dataSourceType,
                    attributes,
                    microflow: series.dataSourceMicroflow,
                    url: url && `${url}&seriesName=${series.name}`,
                    customData: series
                });
            })).then(seriesData => {
                const data = seriesData.map(({ mxObjects, restData, customData }) => {
                    if (mxObjects) {
                        mxObjects.forEach(dataObject => {
                            this.subscriptionHandles.push(mx.data.subscribe({
                                callback: () => {/* callback is required but not in this case */},
                                guid: dataObject.getGuid()
                            }));
                        });
                    }

                    return {
                        data: mxObjects,
                        restData,
                        series: customData as Data.LineSeriesProps
                    };
                });
                this.setState({
                    loading: false,
                    data,
                    scatterData: this.getData(data),
                    seriesOptions: data.map(({ series }) => series.seriesOptions || "{\n\n}")
                });
            }).catch(reason => {
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

    private createScatterData({ data, restData, series }: Data.SeriesData, bar: boolean, index: number, devMode = false): ScatterData {
        const rawOptions = devMode && series.seriesOptions ? JSON.parse(series.seriesOptions) : {};
        const traces = getSeriesTraces({ data, restData, series });
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
            customdata: data || [] // each array element shall be returned as the custom data of a corresponding point
        };
    }

    private handleOnClick = (options: Data.OnClickOptions<{ x: string, y: number }, Data.SeriesProps>) => {
        if (options.mxObject) {
            handleOnClick(options.options, options.mxObject, options.mxForm);
        } else if (options.trace) {
            this.createDataPoint(options.options, options.trace)
                .then(mxObject => handleOnClick(options.options, mxObject, options.mxForm))
                .catch(error => mx.ui.error(`An error occured while creating ${options.options.dataEntity} object: ${error}`));
        }
    }

    private handleOnHover = (options: Data.OnHoverOptions<{ x: string, y: number }, Data.SeriesProps>) => {
        if (options.mxObject) {
            openTooltipForm(options.tooltipNode, options.tooltipForm, options.mxObject);
        } else if (options.trace && options.options.dataEntity) {
            this.createDataPoint(options.options, options.trace)
                .then(mxObject => openTooltipForm(options.tooltipNode, options.tooltipForm, mxObject))
                .catch(error => mx.ui.error(`An error occured while creating ${options.options.dataEntity} object: ${error}`));
        }
    }

    private createDataPoint(seriesProps: Data.SeriesProps, trace: { x: string, y: number }) {
        return new Promise<mendix.lib.MxObject>((resolve, reject) => {
            window.mx.data.create({
                entity: seriesProps.dataEntity,
                callback: mxObject => {
                    mxObject.set(seriesProps.xValueAttribute, trace.x);
                    mxObject.set(seriesProps.yValueAttribute, trace.y);
                    resolve(mxObject);
                },
                error: error => reject(error.message)
            });
        });
    }
}

export { __webpack_public_path__ };
