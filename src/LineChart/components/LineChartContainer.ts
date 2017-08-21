import { Component, createElement } from "react";

import { Alert } from "../../components/Alert";
import { LineChart, Mode } from "./LineChart";
import { MxObject, fetchByMicroflow, fetchByXPath, fetchDataFromSeries } from "../../utils/data";
import { Dimensions, parseStyle } from "../../utils/style";

interface WrapperProps {
    "class"?: string;
    mxform: mxui.lib.form._FormBase;
    mxObject?: mendix.lib.MxObject;
    style?: string;
    readOnly: boolean;
}

export interface LineChartContainerProps extends WrapperProps, Dimensions {
    seriesEntity: string;
    seriesNameAttribute: string;
    dataEntity: string;
    dataSourceType: "XPath" | "microflow";
    entityConstraint: string;
    dataSourceMicroflow: string;
    xValueAttribute: string;
    yValueAttribute: string;
    xAxisSortAttribute: string;
    mode: "lines" | "markers" | "text" | "linesomarkers";
    lineColor: string;
    showGrid: boolean;
    showToolBar: boolean;
    showLegend: boolean;
    responsive: boolean;
    xAxisLabel: string;
    yAxisLabel: string;
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
            className: this.props.class,
            config: {
                displayModeBar: this.props.showToolBar
            },
            data: this.state.data,
            layout: {
                autosize: this.props.responsive,
                showlegend: this.props.showLegend,
                xaxis: {
                    showgrid: this.props.showGrid,
                    title: this.props.xAxisLabel
                },
                yaxis: {
                    showgrid: this.props.showGrid,
                    title: this.props.yAxisLabel
                }
            },
            style: parseStyle(this.props.style),
            width: this.props.width,
            height: this.props.height,
            widthUnit: this.props.widthUnit,
            heightUnit: this.props.heightUnit
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

    public static validateProps(props: LineChartContainerProps): string {
        return props.dataSourceType === "microflow" && !props.dataSourceMicroflow
            ? "Configuration error: data source type is set to 'Microflow' but 'Source microflow' is missing"
            : "";
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

    private fetchData(mxObject?: mendix.lib.MxObject) {
        this.data = [];
        if (mxObject && this.props.seriesEntity) {
            if (this.props.dataSourceType === "XPath") {
                fetchByXPath(mxObject.getGuid(), this.props.seriesEntity, this.props.entityConstraint, this.handleFetchedSeries); // tslint:disable max-line-length
            } else if (this.props.dataSourceType === "microflow" && this.props.dataSourceMicroflow) {
                fetchByMicroflow(this.props.dataSourceMicroflow, mxObject.getGuid(), this.handleFetchedSeries);
            }
        }
    }

    private handleFetchedSeries(allSeries?: MxObject[], error?: Error) {
        if (error) {
            const errorSource = this.props.dataSourceType === "XPath"
                ? this.props.entityConstraint
                : this.props.dataSourceMicroflow;
            window.mx.ui.error(`An error occurred while retrieving data via ${this.props.dataSourceType} (${errorSource}): ${error.message}`); // tslint:disable max-line-length
            this.setState({ data: [] });

            return;
        }

        if (allSeries) {
            fetchDataFromSeries(allSeries, this.props.dataEntity, this.props.xAxisSortAttribute, this.processSeriesData);
        }
    }

    private processSeriesData(singleSeries: MxObject, data: MxObject[], isFinal = false, error?: Error) {
        if (error) {
            window.mx.ui.error(`An error occurred while retrieving chart data: ${error}`);
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
