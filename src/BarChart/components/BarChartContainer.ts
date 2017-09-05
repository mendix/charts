import { Component, ReactElement, createElement } from "react";

import { Alert } from "../../components/Alert";
import { BarChart } from "./BarChart";
import { ChartLoading } from "../../components/ChartLoading";
import { DataSourceProps, OnClickProps, fetchSeriesData, handleOnClick, validateSeriesProps } from "../../utils/data";
import { Dimensions, parseStyle } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

import { BarMode, ScatterData } from "plotly.js";

export interface BarChartContainerProps extends WrapperProps, Dimensions, OnClickProps {
    barMode: BarMode;
    responsive: boolean;
    title?: string;
    showGrid: boolean;
    showToolbar: boolean;
    showLegend: boolean;
    tooltipForm: string;
    xAxisLabel: string;
    yAxisLabel: string;
    series: StaticSeriesProps[];
}

interface BarChartContainerState {
    alertMessage?: string | ReactElement<any>;
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
            alertMessage: validateSeriesProps(this.props.series, this.props.friendlyId),
            loading: true,
            data: []
        };
        this.fetchData = this.fetchData.bind(this);
        this.processSeriesData = this.processSeriesData.bind(this);
        this.handleOnClick = this.handleOnClick.bind(this);
        this.openTooltipForm = this.openTooltipForm.bind(this);
    }

    render() {
        if (this.state.alertMessage) {
            return createElement(Alert, {
                className: "widget-charts-bar-alert",
                message: this.state.alertMessage
            });
        }

        if (this.state.loading) {
            return createElement(ChartLoading, { text: "Loading" });
        }

        return createElement(BarChart, {
            className: this.props.class,
            config: { displayModeBar: this.props.showToolbar, doubleClick: false },
            height: this.props.height,
            heightUnit: this.props.heightUnit,
            layout: {
                autosize: this.props.responsive,
                barmode: this.props.barMode,
                xaxis: { showgrid: this.props.showGrid, title: this.props.xAxisLabel },
                yaxis: { showgrid: this.props.showGrid, title: this.props.yAxisLabel },
                showlegend: this.props.showLegend,
                hovermode: this.props.tooltipForm ? "closest" : undefined
            },
            style: parseStyle(this.props.style),
            width: this.props.width,
            widthUnit: this.props.widthUnit,
            data: this.state.data,
            onClick: this.handleOnClick,
            onHover: this.props.tooltipForm ? this.openTooltipForm : undefined
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

    private openTooltipForm(domNode: HTMLDivElement, dataObject: mendix.lib.MxObject) {
        const context = new mendix.lib.MxContext();
        context.setContext(dataObject.getEntity(), dataObject.getGuid());
        window.mx.ui.openForm(this.props.tooltipForm, { domNode, context });
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
        if (mxObject && this.props.series.length) {
            this.props.series.forEach(series => fetchSeriesData(mxObject, series, this.processSeriesData));
        } else {
            this.setState({ loading: false, data: [] });
        }
    }

    private processSeriesData(data: mendix.lib.MxObject[], errorMessage?: string) {
        const activeSeries = this.props.series[this.activeStaticIndex];
        const isFinal = this.props.series.length === this.activeStaticIndex + 1;
        this.activeStaticIndex = isFinal ? 0 : this.activeStaticIndex + 1;
        if (errorMessage) {
            window.mx.ui.error(errorMessage);
            this.setState({ data: [], loading: false });

            return;
        }
        const fetchedData = data.map(value => ({
            x: value.get(activeSeries.xValueAttribute) as Plotly.Datum,
            y: parseInt(value.get(activeSeries.yValueAttribute) as string, 10) as Plotly.Datum
        }));

        const barData = {
            name: activeSeries.name,
            type: "bar",
            hoverinfo: this.props.tooltipForm ? "text" : "all",
            x: fetchedData.map(value => value.x),
            y: fetchedData.map(value => value.y),
            mxObjects: data
        } as ScatterData;

        this.data.push(barData);
        if (isFinal) {
            this.setState({ data: this.data, loading: false });
        }
    }
}
