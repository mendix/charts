import { Component, ReactElement, createElement } from "react";

import { Alert } from "../../components/Alert";
import { BarChart } from "./BarChart";
import { ChartLoading } from "../../components/ChartLoading";
import { DataSourceProps, OnClickProps, fetchSeriesData, handleOnClick, validateSeriesProps } from "../../utils/data";
import { Dimensions, parseStyle } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

import { BarMode, ScatterData } from "plotly.js";

export interface BarChartContainerProps extends WrapperProps, Dimensions {
    series: SeriesProps[];
    showLegend: boolean;
    showGrid: boolean;
    showToolbar: boolean;
    barMode: BarMode;
    orientation: "bar" | "column";
    tooltipForm: string;
    xAxisLabel: string;
    yAxisLabel: string;
    layoutOptions: string;
}

interface BarChartContainerState {
    alertMessage?: string | ReactElement<any>;
    data?: ScatterData[];
    loaded?: boolean;
}

interface SeriesProps extends DataSourceProps, OnClickProps {
    name: string;
}

export default class BarChartContainer extends Component<BarChartContainerProps, BarChartContainerState> {
    static defaultProps: Partial<BarChartContainerProps> = {
        orientation: "bar"
    };
    private subscriptionHandle: number;
    private data: ScatterData[] = [];
    private activeSeriesIndex = 0;

    constructor(props: BarChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: validateSeriesProps(this.props.series, this.props.friendlyId, props.layoutOptions),
            loaded: true,
            data: []
        };
        this.fetchData = this.fetchData.bind(this);
        this.processSeriesData = this.processSeriesData.bind(this);
        this.handleOnClick = this.handleOnClick.bind(this);
        this.openTooltipForm = this.openTooltipForm.bind(this);
    }

    render() {
        return createElement("div", {}, this.getContent());
    }

    componentWillReceiveProps(newProps: BarChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        if (!this.state.alertMessage) {
            this.fetchData(newProps.mxObject);
        }
    }

    componentWillUnmount() {
        if (this.subscriptionHandle) {
            window.mx.data.unsubscribe(this.subscriptionHandle);
        }
    }

    private getContent() {
        if (this.state.alertMessage) {
            return createElement(Alert, {
                className: "widget-charts-bar-alert",
                message: this.state.alertMessage
            });
        }

        if (this.state.loaded) {
            return createElement(ChartLoading, { text: "Loading" });
        }

        return createElement(BarChart, {
            orientation: this.props.orientation,
            className: this.props.class,
            config: { displayModeBar: this.props.showToolbar, doubleClick: false },
            height: this.props.height,
            heightUnit: this.props.heightUnit,
            layout: {
                autosize: true,
                barmode: this.props.barMode,
                xaxis: {
                    showgrid: this.props.showGrid,
                    title: this.props.xAxisLabel,
                    fixedrange: true
                },
                yaxis: {
                    showgrid: this.props.showGrid,
                    title: this.props.yAxisLabel,
                    fixedrange: true
                },
                showlegend: this.props.showLegend,
                hovermode: "closest",
                ...this.props.layoutOptions ? JSON.parse(this.props.layoutOptions) : {}
            },
            style: parseStyle(this.props.style),
            width: this.props.width,
            widthUnit: this.props.widthUnit,
            data: this.state.data,
            onClick: this.handleOnClick,
            onHover: this.props.tooltipForm ? this.openTooltipForm : undefined
        });
    }

    private handleOnClick(dataObject: mendix.lib.MxObject, seriesIndex: number) {
        const series = this.props.series[seriesIndex];
        handleOnClick(series, dataObject);
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
        if (!this.state.loaded) {
            this.setState({ loaded: true });
        }
        if (mxObject && this.props.series.length) {
            this.props.series.forEach(series => fetchSeriesData(mxObject, series, this.processSeriesData));
        } else {
            this.setState({ loaded: false, data: [] });
        }
    }

    private processSeriesData(data: mendix.lib.MxObject[], errorMessage?: string) {
        const activeSeries = this.props.series[this.activeSeriesIndex];
        const isFinal = this.props.series.length === this.activeSeriesIndex + 1;
        this.activeSeriesIndex = isFinal ? 0 : this.activeSeriesIndex + 1;
        if (errorMessage) {
            window.mx.ui.error(errorMessage);
            this.setState({ data: [], loaded: false });

            return;
        }
        const fetchedData = data.map(value => ({
            x: value.get(activeSeries.xValueAttribute) as Plotly.Datum,
            y: parseInt(value.get(activeSeries.yValueAttribute) as string, 10) as Plotly.Datum
        }));

        const x = fetchedData.map(value => value.x);
        const y = fetchedData.map(value => value.y);
        const rawOptions = activeSeries.seriesOptions ? JSON.parse(activeSeries.seriesOptions) : {};
        const barData: Partial<ScatterData> = {
            ...rawOptions,
            name: activeSeries.name,
            type: "bar",
            hoverinfo: this.props.tooltipForm ? "text" : undefined,
            x: this.props.orientation === "bar" ? y : x,
            y: this.props.orientation === "bar" ? x : y,
            orientation: this.props.orientation === "bar" ? "h" : "v",
            mxObjects: data,
            seriesIndex: this.activeSeriesIndex
        };

        this.data.push(barData as ScatterData);
        if (isFinal) {
            this.setState({ data: this.data, loaded: false });
        }
    }
}
