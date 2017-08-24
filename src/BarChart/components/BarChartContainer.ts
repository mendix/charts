import { Component, createElement } from "react";

import { BarChart, BarChartProps } from "./BarChart";
import { Alert } from "../../components/Alert";
import { DataSourceProps, MxObject, OnClickProps, fetchDataFromSeries, fetchSeriesData, handleOnClick
} from "../../utils/data";
import { Dimensions, parseStyle } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

import { BarMode, ScatterData } from "plotly.js";

export interface BarChartContainerProps extends WrapperProps, Dimensions, DataSourceProps, OnClickProps {
    barMode: BarMode;
    responsive: boolean;
    title?: string;
    showGrid: boolean;
    showToolbar: boolean;
}

interface BarChartContainerState {
    alertMessage?: string;
    data?: ScatterData[];
}

export default class BarChartContainer extends Component<BarChartContainerProps, BarChartContainerState> {
    private subscriptionHandle: number;
    private data: ScatterData[] = [];

    constructor(props: BarChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: BarChartContainer.validateProps(this.props),
            data: []
        };
        this.fetchData = this.fetchData.bind(this);
        this.handleFetchedSeries = this.handleFetchedSeries.bind(this);
        this.processSeriesData = this.processSeriesData.bind(this);
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
        if (mxObject) {
            fetchSeriesData(mxObject, this.props, this.handleFetchedSeries);
        }
    }

    private handleFetchedSeries(allSeries?: MxObject[], errorMessage?: string) {
        if (errorMessage) {
            window.mx.ui.error(errorMessage);
            this.setState({ data: [] });

            return;
        }

        if (allSeries) {
            fetchDataFromSeries(allSeries, this.props.dataEntity, this.props.xAxisSortAttribute, this.processSeriesData); // tslint:disable-line
        }
    }

    private processSeriesData(singleSeries: MxObject, data: MxObject[], isFinal = false, error?: Error) {
        if (error) {
            window.mx.ui.error(`An error occurred while retrieving chart data: ${error}`);
            this.setState({ data: [] });

            return;
        }
        const seriesName = singleSeries.get(this.props.seriesNameAttribute) as string;
        const fetchedData = data.map(value => ({
            x: value.get(this.props.xValueAttribute) as Plotly.Datum,
            y: parseInt(value.get(this.props.yValueAttribute) as string, 10) as Plotly.Datum
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
}
