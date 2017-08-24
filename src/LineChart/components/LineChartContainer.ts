import { Component, createElement } from "react";

import { Alert } from "../../components/Alert";
import { LineChart, LineChartProps, Mode } from "./LineChart";
import {
    DataSourceProps, MxObject, OnClickProps, fetchDataFromSeries, fetchSeriesData, handleOnClick
} from "../../utils/data";
import { Dimensions, parseStyle } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

export interface LineChartContainerProps extends WrapperProps, Dimensions, DataSourceProps, OnClickProps {
    mode: "lines" | "markers" | "text" | "linesomarkers";
    lineColor: string;
    showGrid: boolean;
    showToolBar: boolean;
    showLegend: boolean;
    responsive: boolean;
}

interface LineChartContainerState {
    alertMessage?: string;
    data?: Plotly.ScatterData[];
}

export default class LineChartContainer extends Component<LineChartContainerProps, LineChartContainerState> {
    private subscriptionHandle: number;
    private data: Plotly.ScatterData[] = [];

    constructor(props: LineChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: LineChartContainer.validateProps(props),
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
                className: "widget-charts-line-alert",
                message: this.state.alertMessage
            });
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
            ? "Configuration error: data source type is set to 'Microflow' but 'Source microflow' is missing"
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
            fetchDataFromSeries(allSeries, this.props.dataEntity, this.props.xAxisSortAttribute, this.processSeriesData); // tslint:disable max-line-length
        }
    }

    private processSeriesData(singleSeries: MxObject, data: MxObject[], isFinal = false, error?: Error) {
        if (error) {
            window.mx.ui.error(`An error occurred while retrieving chart data: ${error.message}`);
            this.setState({ data: [] });

            return;
        }
        const lineColor = singleSeries.get(this.props.lineColor) as string;
        const seriesName = singleSeries.get(this.props.seriesNameAttribute) as string;
        const fetchedData = data.map(value => ({
            x: value.get(this.props.xValueAttribute) as Plotly.Datum,
            y: parseInt(value.get(this.props.yValueAttribute) as string, 10) as Plotly.Datum
        }));

        const lineData = {
            connectgaps: true,
            line: {
                color: lineColor
            },
            mode: this.props.mode.replace("o", "+") as Mode,
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
}
