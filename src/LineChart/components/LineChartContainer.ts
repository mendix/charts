import { Component, createElement } from "react";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { LineChart, LineChartProps, Mode } from "./LineChart";
import {
    DataSourceProps, DynamicDataSourceProps, MxObject, OnClickProps, fetchDataFromSeries, fetchSeriesData, handleOnClick
} from "../../utils/data";
import { Dimensions, parseStyle } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

export interface LineChartContainerProps extends WrapperProps, Dimensions, DynamicDataSourceProps, OnClickProps {
    mode: Mode;
    lineColor: string;
    showGrid: boolean;
    showToolBar: boolean;
    showLegend: boolean;
    responsive: boolean;
    staticSeries: StaticSeriesProps[];
}

interface LineChartContainerState {
    alertMessage?: string;
    data?: Plotly.ScatterData[];
    loadingStatic?: boolean;
    loadingDynamic?: boolean;
}

export interface StaticSeriesProps extends DataSourceProps {
    name: string;
    mode: Mode;
    lineColor: string;
}

export default class LineChartContainer extends Component<LineChartContainerProps, LineChartContainerState> {
    private subscriptionHandle: number;
    private data: Plotly.ScatterData[] = [];
    private activeStaticIndex = 0;

    constructor(props: LineChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: LineChartContainer.validateProps(props),
            data: [],
            loadingStatic: true,
            loadingDynamic: true
        };
        this.fetchData = this.fetchData.bind(this);
        this.handleFetchedSeries = this.handleFetchedSeries.bind(this);
        this.processDynamicSeriesData = this.processDynamicSeriesData.bind(this);
        this.processStaticSeriesData = this.processStaticSeriesData.bind(this);
        this.handleOnClick = this.handleOnClick.bind(this);
    }

    render() {
        if (this.state.alertMessage) {
            return createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-charts-line-alert",
                message: this.state.alertMessage
            });
        }

        if (this.state.loadingStatic || this.state.loadingDynamic) {
            return createElement(ChartLoading, { text: "Loading" });
        }

        return createElement(LineChart, {
            ...LineChartContainer.getLineChartProps(this.props),
            data: this.state.data,
            onClickAction: this.handleOnClick
        });
    }

    componentWillReceiveProps(newProps: LineChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        this.fetchData(newProps.mxObject);
    }

    componentWillUnmount() {
        if (this.subscriptionHandle) {
            mx.data.unsubscribe(this.subscriptionHandle);
        }
    }

    private handleOnClick() {
        handleOnClick(this.props, this.props.mxObject);
    }

    public static validateProps(props: LineChartContainerProps): string {
        return props.dataSourceType === "microflow" && !props.dataSourceMicroflow
            ? "Configuration error in line chart: 'Data source type' is set to 'Microflow' but the microflow is missing"
            : "";
    }

    public static getLineChartProps(props: LineChartContainerProps): LineChartProps {
        return {
            className: props.class,
            config: { displayModeBar: props.showToolBar, doubleClick: false },
            layout: {
                autosize: props.responsive,
                showlegend: props.showLegend,
                xaxis: { showgrid: props.showGrid, title: props.xAxisLabel },
                yaxis: { showgrid: props.showGrid, title: props.yAxisLabel }
            },
            style: parseStyle(props.style),
            width: props.width,
            height: props.height,
            widthUnit: props.widthUnit,
            heightUnit: props.heightUnit
        };
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

    private fetchData(mxObject?: mendix.lib.MxObject) {
        this.data = [];
        if (!this.state.loadingStatic || !this.state.loadingDynamic) {
            this.setState({ loadingStatic: true, loadingDynamic: true });
        }
        if (mxObject) {
            if (this.props.staticSeries.length > 0) {
                this.props.staticSeries.forEach(staticSeries =>
                    fetchSeriesData(mxObject, staticSeries.dataEntity, staticSeries, this.processStaticSeriesData)
                );
            } else {
                this.setState({ loadingStatic: false });
            }
            fetchSeriesData(mxObject, this.props.seriesEntity, this.props, this.handleFetchedSeries);
        } else {
            this.setState({ loadingStatic: false, loadingDynamic: false, data: [] });
        }
    }

    private processStaticSeriesData(data: MxObject[], errorMessage?: string) {
        const activeSeries = this.props.staticSeries[this.activeStaticIndex];
        const isFinal = this.props.staticSeries.length === this.activeStaticIndex + 1;
        this.activeStaticIndex = isFinal ? 0 : this.activeStaticIndex + 1;
        if (errorMessage) {
            this.handleFetchDataError(errorMessage);

            return;
        }
        this.processSeriesData(activeSeries.name, activeSeries.lineColor, activeSeries.mode, data, activeSeries, isFinal); // tslint:disable-line max-line-length
        if (isFinal) {
            this.setState({ loadingStatic: false });
        }
    }

    private handleFetchedSeries(allSeries?: MxObject[], errorMessage?: string) {
        if (errorMessage) {
            this.handleFetchDataError(errorMessage);

            return;
        }

        if (allSeries && allSeries.length) {
            fetchDataFromSeries(allSeries, this.props.dataEntity, this.props.xAxisSortAttribute, this.processDynamicSeriesData); // tslint:disable max-line-length
        } else {
            this.setState({ loadingDynamic: false });
        }
    }

    private processDynamicSeriesData(singleSeries: MxObject, data: MxObject[], isFinal = false, error?: Error) {
        if (error) {
            this.handleFetchDataError(`An error occurred while retrieving dynamic chart data: ${error.message}`);

            return;
        }
        const lineColor = singleSeries.get(this.props.lineColor) as string;
        const seriesName = singleSeries.get(this.props.seriesNameAttribute) as string;
        this.processSeriesData(seriesName, lineColor, this.props.mode, data, this.props, isFinal);
        if (isFinal) {
            this.setState({ loadingDynamic: false });
        }
    }

    private processSeriesData<T extends DataSourceProps>(seriesName: string, lineColor: string, mode: Mode, data: MxObject[], dataOptions: T, isFinal = false) { // tslint:disable-line max-line-length
        const fetchedData = data.map(value => ({
            x: value.get(dataOptions.xValueAttribute) as Plotly.Datum,
            y: parseInt(value.get(dataOptions.yValueAttribute) as string, 10) as Plotly.Datum
        }));

        const lineData = {
            connectgaps: true,
            line: { color: lineColor },
            mode: mode.replace("X", "+") as Mode,
            name: seriesName,
            type: "scatter",
            x: fetchedData.map(value => value.x),
            y: fetchedData.map(value => value.y)
        } as Plotly.ScatterData;

        this.data.push(lineData);
        if (isFinal) {
            this.setState({ data: this.data });
        }
    }

    private handleFetchDataError(errorMessage: string) {
        window.mx.ui.error(errorMessage);
        this.setState({ data: [], loadingStatic: false, loadingDynamic: false });
    }
}
