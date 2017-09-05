import { Component, createElement } from "react";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { PieChart } from "./PieChart";
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
    tooltipForm: string;
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
    data?: mendix.lib.MxObject[];
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
        this.openTooltipForm = this.openTooltipForm.bind(this);
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
            className: this.props.class,
            config: { displayModeBar: this.props.showToolBar },
            data: [ {
                hole: this.props.chartType === "donut" ? .4 : 0,
                hoverinfo: this.props.tooltipForm ? "none" : "label",
                labels: this.state.labels || [],
                marker: { colors: this.state.colors || [] },
                type: "pie",
                values: this.state.values || []
            } ],
            height: this.props.height,
            heightUnit: this.props.heightUnit,
            layout: {
                autosize: this.props.responsive,
                showlegend: this.props.showLegend
            },
            style: parseStyle(this.props.style),
            type: this.props.chartType,
            width: this.props.width,
            widthUnit: this.props.widthUnit,
            onClick: this.handleOnClick,
            onHover: this.props.tooltipForm ? this.openTooltipForm : undefined
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
            data,
            loading: false
        });
    }

    private handleOnClick() {
        handleOnClick(this.props, this.props.mxObject);
    }

    private openTooltipForm(domNode: HTMLDivElement, index: number) {
        if (this.state.data && this.state.data.length) {
            const dataObject = this.state.data[index];
            const context = new mendix.lib.MxContext();
            context.setContext(dataObject.getEntity(), dataObject.getGuid());
            window.mx.ui.openForm(this.props.tooltipForm, { domNode, context });
        }
    }

    public static validateProps(props: PieChartContainerProps): string {
        return props.dataSourceType === "microflow" && !props.dataSourceMicroflow
            ? `Configuration error in pie chart: 'Data source type' is set to 'Microflow' but the microflow is missing`
            : "";
    }
}
