import { Component, createElement } from "react";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { PieChart, PieChartProps } from "./PieChart";
import { OnClickProps, fetchByMicroflow, fetchByXPath, handleOnClick } from "../../utils/data";
import { Dimensions, parseStyle } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

export type ChartType = "pie" | "donut";

export interface PieChartContainerProps extends WrapperProps, Dimensions, OnClickProps {
    dataEntity: string;
    dataSourceType: "XPath" | "microflow";
    entityConstraint: string;
    dataSourceMicroflow: string;
    nameAttribute: string;
    valueAttribute: string;
    chartType: ChartType;
    colorAttribute: string;
    showToolBar: boolean;
    showLegend: boolean;
    responsive: boolean;
}

interface PieChartContainerState extends PieData {
    alertMessage?: string;
    loading?: boolean;
}

export interface PieData {
    colors?: string[];
    labels?: string[];
    values?: number[];
}

export default class PieChartContainer extends Component<PieChartContainerProps, PieChartContainerState> {
    private subscriptionHandle: number;

    constructor(props: PieChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: PieChartContainer.validateProps(this.props),
            colors: [],
            labels: [],
            values: [],
            loading: true
        };
        this.fetchData = this.fetchData.bind(this);
        this.processData = this.processData.bind(this);
        this.handleOnClick = this.handleOnClick.bind(this);
    }

    render() {
        if (this.state.alertMessage) {
            return createElement(Alert, {
                bootstrapStyle: "danger",
                className: `widget-charts-${this.props.chartType}-alert`,
                message: this.state.alertMessage
            });
        }

        if (this.state.loading) {
            return createElement(ChartLoading, { text: "Loading" });
        }

        return createElement(PieChart, {
            ...PieChartContainer.getPieChartProps(this.props, this.state),
            onClickAction: this.handleOnClick
        });
    }

    componentWillReceiveProps(newProps: PieChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        this.fetchData(newProps.mxObject);
    }

    componentWillUnmount() {
        if (this.subscriptionHandle) {
            window.mx.data.unsubscribe(this.subscriptionHandle);
        }
    }

    public static getPieChartProps<T extends PieData>(props: PieChartContainerProps, data: T): PieChartProps {
        return {
            className: props.class,
            config: { displayModeBar: props.showToolBar },
            data: [ {
                hole: props.chartType === "donut" ? .4 : 0,
                hoverinfo: "label",
                labels: data.labels || [],
                marker: { colors: data.colors || [] },
                type: "pie",
                values: data.values || []
            } ],
            height: props.height,
            heightUnit: props.heightUnit,
            layout: {
                autosize: props.responsive,
                showlegend: props.showLegend
            },
            style: parseStyle(props.style),
            type: props.chartType,
            width: props.width,
            widthUnit: props.widthUnit
        };
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        if (this.subscriptionHandle) {
            window.mx.data.unsubscribe(this.subscriptionHandle);
        }

        if (mxObject) {
            this.subscriptionHandle = window.mx.data.subscribe({
                callback: () => this.fetchData(mxObject),
                guid: mxObject.getGuid()
            });
        }
    }

    private fetchData(mxObject?: mendix.lib.MxObject) {
        if (!this.state.loading) {
            this.setState({ loading: true });
        }
        if (mxObject && this.props.dataEntity) {
            if (this.props.dataSourceType === "XPath") {
                fetchByXPath(mxObject.getGuid(), this.props.dataEntity, this.props.entityConstraint, this.processData);
            } else if (this.props.dataSourceType === "microflow" && this.props.dataSourceMicroflow) {
                fetchByMicroflow(this.props.dataSourceMicroflow, mxObject.getGuid(), this.processData);
            }
        } else {
            this.setState({ loading: false, colors: [], labels: [], values: [] });
        }
    }

    private processData(data: mendix.lib.MxObject[], error?: string) {
        if (error) {
            window.mx.ui.error(`An error occurred while retrieving chart data: ${error}`);
            this.setState({ colors: [], labels: [], values: [], loading: false });

            return;
        }
        this.setState({
            colors: data.map(value => value.get(this.props.colorAttribute) as string),
            labels: data.map(value => value.get(this.props.nameAttribute) as string),
            values: data.map(value => parseFloat(value.get(this.props.valueAttribute) as string)),
            loading: false
        });
    }

    private handleOnClick() {
        handleOnClick(this.props, this.props.mxObject);
    }

    public static validateProps(props: PieChartContainerProps): string {
        return props.dataSourceType === "microflow" && !props.dataSourceMicroflow
            ? `Configuration error in pie chart: 'Data source type' is set to 'Microflow' but the microflow is missing`
            : "";
    }
}
