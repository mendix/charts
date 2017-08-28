import { Component, createElement } from "react";

import { Alert } from "../../components/Alert";
import { BarChart, BarChartProps } from "./BarChart";
import { ChartLoading } from "../../components/ChartLoading";
import {
    DataSourceProps, DynamicDataSourceProps, MxObject, OnClickProps, fetchDataFromSeries, fetchSeriesData, handleOnClick
} from "../../utils/data";
import { Dimensions, parseStyle } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

import { BarMode, ScatterData } from "plotly.js";

export interface BarChartContainerProps extends WrapperProps, Dimensions, DynamicDataSourceProps, OnClickProps {
    barMode: BarMode;
    responsive: boolean;
    title?: string;
    showGrid: boolean;
    showToolbar: boolean;
    staticSeries: StaticSeriesProps[];
}

interface BarChartContainerState {
    alertMessage?: string;
    data?: ScatterData[];
    loading?: boolean;
}

interface StaticSeriesProps extends DataSourceProps {
    name: string;
}

export default class BarChartContainer extends Component<BarChartContainerProps, BarChartContainerState> {
    private subscriptionHandle: number;
    private data: ScatterData[] = [];
    private activeStaticIndex = 0;

    constructor(props: BarChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: BarChartContainer.validateProps(this.props),
            loading: true,
            data: []
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
                className: "widget-charts-bar-alert",
                message: this.state.alertMessage
            });
        }

        if (this.state.loading) {
            return createElement(ChartLoading, { text: "Loading" });
        }

        return createElement(BarChart, {
            ...BarChartContainer.getBarChartProps(this.props),
            data: this.state.data,
            onClickAction: this.handleOnClick
        });
    }

    componentWillReceiveProps(newProps: BarChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        this.fetchData(newProps.mxObject);
    }

    componentWillUnmount() {
        if (this.subscriptionHandle) {
            window.mx.data.unsubscribe(this.subscriptionHandle);
        }
    }

    private handleOnClick() {
        handleOnClick(this.props, this.props.mxObject);
    }

    public static validateProps(props: BarChartContainerProps): string {
        let errorMessage = "";
        if (props.dataSourceType === "microflow" && !props.dataSourceMicroflow) {
            errorMessage = ` data source type is set to 'Microflow' but 'Source microflow' is missing`;
        }

        return errorMessage && `Configuration error : ${errorMessage}`;
    }

    public static getBarChartProps(props: BarChartContainerProps): BarChartProps {
        return {
            className: props.class,
            config: { displayModeBar: props.showToolbar, doubleClick: false },
            height: props.height,
            heightUnit: props.heightUnit,
            layout: {
                autosize: props.responsive,
                barmode: props.barMode,
                xaxis: { showgrid: props.showGrid, title: props.xAxisLabel },
                yaxis: { showgrid: props.showGrid, title: props.yAxisLabel }
            },
            style: parseStyle(props.style),
            width: props.width,
            widthUnit: props.widthUnit
        };
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        this.componentWillUnmount();

        if (mxObject) {
            this.subscriptionHandle = window.mx.data.subscribe({
                callback: () => this.fetchData(mxObject),
                guid: mxObject.getGuid()
            });
        }
    }

    private fetchData(mxObject?: mendix.lib.MxObject) {
        this.data = [];
        if (!this.state.loading) {
            this.setState({ loading: true });
        }
        if (mxObject) {
            this.props.staticSeries.forEach(staticSeries =>
                fetchSeriesData(mxObject, staticSeries.dataEntity, staticSeries, this.processStaticSeriesData)
            );
            fetchSeriesData(mxObject, this.props.seriesEntity, this.props, this.handleFetchedSeries);
        } else {
            this.setState({ loading: false, data: [] });
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
        this.processSeriesData(activeSeries.name, data, activeSeries, isFinal);
    }

    private handleFetchedSeries(allSeries?: MxObject[], errorMessage?: string) {
        if (errorMessage) {
            this.handleFetchDataError(errorMessage);

            return;
        }

        if (allSeries) {
            fetchDataFromSeries(allSeries, this.props.dataEntity, this.props.xAxisSortAttribute, this.processDynamicSeriesData); // tslint:disable-line
        } else {
            this.setState({ loading: false });
        }
    }

    private processDynamicSeriesData(singleSeries: MxObject, data: MxObject[], isFinal = false, error?: Error) {
        if (error) {
            this.handleFetchDataError(`An error occurred while retrieving dynamic chart data: ${error.message}`);

            return;
        }
        const seriesName = singleSeries.get(this.props.seriesNameAttribute) as string;
        this.processSeriesData(seriesName, data, this.props, isFinal);
        if (isFinal) {
            this.setState({ loading: false });
        }
    }

    private processSeriesData<T extends DataSourceProps>(seriesName: string, data: MxObject[], dataOptions: T, isFinal = false) { // tslint:disable-line max-line-length
        const fetchedData = data.map(value => ({
            x: value.get(dataOptions.xValueAttribute) as Plotly.Datum,
            y: parseInt(value.get(dataOptions.yValueAttribute) as string, 10) as Plotly.Datum
        }));

        const barData = {
            name: seriesName,
            type: "bar",
            x: fetchedData.map(value => value.x),
            y: fetchedData.map(value => value.y)
        } as ScatterData;

        this.data.push(barData);
        if (isFinal) {
            this.setState({ data: this.data });
        }
    }

    private handleFetchDataError(errorMessage: string) {
        window.mx.ui.error(errorMessage);
        this.setState({ data: [], loading: false });
    }
}
