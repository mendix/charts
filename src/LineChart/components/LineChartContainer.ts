import { Component, createElement } from "react";
import { LineChart } from "./LineChart";
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
    dataSourceType: "xpath" | "microflow";
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

    constructor(props: LineChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: LineChartContainer.validateProps(this.props),
            data: []
        };
        this.fetchData = this.fetchData.bind(this);
    }

    render() {
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
        console.log(mxObject); // tslint:disable-line
    }
}
