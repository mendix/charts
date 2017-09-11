import { Component, ReactElement, createElement } from "react";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { DataSourceProps, OnClickProps, fetchSeriesData, handleOnClick, validateSeriesProps } from "../../utils/data";
import { LineChart, Mode } from "./LineChart";
import { Dimensions, parseStyle } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

export interface LineChartContainerProps extends WrapperProps, Dimensions, OnClickProps {
    series: StaticSeriesProps[];
    showGrid: boolean;
    mode: Mode;
    lineColor: string;
    fill: boolean;
    showToolBar: boolean;
    showLegend: boolean;
    responsive: boolean;
    tooltipForm: string;
    xAxisLabel: string;
    yAxisLabel: string;
}

interface LineChartContainerState {
    alertMessage?: string | ReactElement<any>;
    data?: Plotly.ScatterData[];
    loading?: boolean;
}

export interface StaticSeriesProps extends DataSourceProps {
    name: string;
    mode: Mode;
    lineColor: string;
    lineStyle: "linear" | "spline";
}

export default class LineChartContainer extends Component<LineChartContainerProps, LineChartContainerState> {
    private subscriptionHandle: number;
    private data: Plotly.ScatterData[] = [];
    private activeStaticIndex = 0;

    constructor(props: LineChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: validateSeriesProps(props.series, this.props.friendlyId),
            data: [],
            loading: true
        };
        this.fetchData = this.fetchData.bind(this);
        this.processSeriesData = this.processSeriesData.bind(this);
        this.handleOnClick = this.handleOnClick.bind(this);
        this.openTooltipForm = this.openTooltipForm.bind(this);
    }

    render() {
        if (this.state.alertMessage) {
            return createElement(Alert, {
                className: "widget-charts-line-alert",
                message: this.state.alertMessage
            });
        }

        if (this.state.loading) {
            return createElement(ChartLoading, { text: "Loading" });
        }

        return createElement(LineChart, {
            className: this.props.class,
            config: { displayModeBar: this.props.showToolBar, doubleClick: false },
            layout: {
                autosize: this.props.responsive,
                hovermode: this.props.tooltipForm ? "closest" : undefined,
                showlegend: this.props.showLegend,
                xaxis: { showgrid: this.props.showGrid, title: this.props.xAxisLabel },
                yaxis: { showgrid: this.props.showGrid, title: this.props.yAxisLabel }
            },
            style: parseStyle(this.props.style),
            width: this.props.width,
            height: this.props.height,
            widthUnit: this.props.widthUnit,
            heightUnit: this.props.heightUnit,
            data: this.state.data,
            onClick: this.handleOnClick,
            onHover: this.props.tooltipForm ? this.openTooltipForm : undefined
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

    private openTooltipForm(domNode: HTMLDivElement, dataObject: mendix.lib.MxObject) {
        const context = new mendix.lib.MxContext();
        context.setContext(dataObject.getEntity(), dataObject.getGuid());
        window.mx.ui.openForm(this.props.tooltipForm, { domNode, context });
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

        const lineData = {
            connectgaps: true,
            hoveron: "points",
            hoverinfo: this.props.tooltipForm ? "text" : "all",
            line: { color: activeSeries.lineColor, shape: activeSeries.lineStyle },
            mode: activeSeries.mode.replace("X", "+") as Mode,
            name: activeSeries.name,
            type: "scatter",
            fill: this.props.fill ? "tonexty" : "none",
            x: fetchedData.map(value => value.x),
            y: fetchedData.map(value => value.y),
            mxObjects: data
        } as Plotly.ScatterData;

        this.data.push(lineData);
        if (isFinal) {
            this.setState({ data: this.data, loading: false });
        }
    }
}
