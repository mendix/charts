import { Component, ReactElement, createElement } from "react";
import * as classNames from "classnames";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { LineChartContainerProps, SeriesProps } from "./LineChartContainer";

import deepMerge from "deepmerge";
import * as elementResize from "element-resize-detector";
import { Config, Layout, ScatterData, ScatterHoverData } from "plotly.js";
import { newPlot, purge } from "../../PlotlyCustom";
import { getDimensions, parseStyle } from "../../utils/style";

import "../../ui/Charts.scss";

export interface LineChartProps extends LineChartContainerProps {
    data?: Data[];
    defaultData?: ScatterData[];
    loading?: boolean;
    alertMessage?: string | ReactElement<any>;
    onClick?: (dataObject: mendix.lib.MxObject, seriesIndex: number) => void;
    onHover?: (node: HTMLDivElement, dataObject: mendix.lib.MxObject) => void;
}

export type Mode = "lines" | "markers" | "lines+markers";

export interface Data {
    data: mendix.lib.MxObject[];
    series: SeriesProps;
}

export class LineChart extends Component<LineChartProps, {}> {
    private lineChartNode?: HTMLDivElement;
    private tooltipNode: HTMLDivElement;
    private timeoutId: number;
    private resizeDetector = elementResize({ strategy: "scroll" });

    constructor(props: LineChartProps) {
        super(props);

        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
        this.getTooltipNodeRef = this.getTooltipNodeRef.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onHover = this.onHover.bind(this);
        this.clearToolTip = this.clearToolTip.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, {
                className: "widget-charts-line-alert",
                message: this.props.alertMessage
            });
        }
        if (this.props.loading) {
            return createElement(ChartLoading, { text: "Loading" });
        }

        return createElement("div",
            {
                className: classNames("widget-charts-line", this.props.class),
                ref: this.getPlotlyNodeRef,
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) }
            },
            createElement("div", { className: "widget-charts-tooltip", ref: this.getTooltipNodeRef })
        );
    }

    componentDidMount() {
        if (!this.props.loading) {
            this.renderChart(this.props);
            this.addResizeListener();
        }
    }

    componentDidUpdate() {
        if (!this.props.loading) {
            this.renderChart(this.props);
            this.addResizeListener();
        }
    }

    componentWillUnmount() {
        if (this.lineChartNode) {
            purge(this.lineChartNode);
        }
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.lineChartNode = node;
    }

    private getTooltipNodeRef(node: HTMLDivElement) {
        this.tooltipNode = node;
    }

    private addResizeListener() {
        if (this.lineChartNode && this.lineChartNode.parentElement) {
            this.resizeDetector.removeListener(this.lineChartNode.parentElement, this.onResize);
            this.resizeDetector.listenTo(this.lineChartNode.parentElement, this.onResize);
        }
    }

    private renderChart(props: LineChartProps) {
        if (this.lineChartNode) {
            newPlot(this.lineChartNode, this.getData(props), this.getLayoutOptions(props), this.getConfigOptions(props))
                .then(myPlot => {
                    myPlot.on("plotly_click", this.onClick);
                    myPlot.on("plotly_hover", this.onHover);
                    myPlot.on("plotly_unhover", this.clearToolTip);
                });
        }
    }

    private getLayoutOptions(props: LineChartProps): Partial<Layout> {
        const advancedOptions = props.layoutOptions ? JSON.parse(props.layoutOptions) : {};

        return deepMerge.all([ {
            autosize: true,
            hovermode: props.tooltipForm ? "closest" : undefined,
            showlegend: props.showLegend,
            xaxis: {
                title: props.xAxisLabel,
                showgrid: props.showGrid,
                fixedrange: true
            },
            yaxis: {
                title: props.yAxisLabel,
                showgrid: props.showGrid,
                fixedrange: true
            },
            width: this.lineChartNode && this.lineChartNode.clientWidth,
            height: this.lineChartNode && this.lineChartNode.clientHeight
        }, advancedOptions ]);
    }

    private getConfigOptions(props: LineChartProps): Partial<Config> {
        return { displayModeBar: props.showToolbar, doubleClick: false };
    }

    private getData(props: LineChartProps): ScatterData[] {
        if (props.data) {
            return props.data.map(data => {
                const values = data.data.map(value => ({
                    x: value.get(data.series.xValueAttribute) as Plotly.Datum,
                    y: parseInt(value.get(data.series.yValueAttribute) as string, 10) as Plotly.Datum
                }));
                const rawOptions = data.series.seriesOptions
                    ? JSON.parse(data.series.seriesOptions)
                    : {};

                return deepMerge.all([ rawOptions, {
                    connectgaps: true,
                    hoveron: "points",
                    hoverinfo: props.tooltipForm ? "text" : undefined,
                    line: {
                        color: data.series.lineColor,
                        shape: data.series.lineStyle
                    },
                    mode: data.series.mode.replace("X", "+") as Mode,
                    name: data.series.name,
                    type: "scatter",
                    fill: props.fill ? "tonexty" : "none",
                    x: values.map(value => value.x),
                    y: values.map(value => value.y),
                    mxObjects: data.data
                } ]);
            });
        }

        return props.defaultData || [];
    }

    private onClick(data: ScatterHoverData) {
        const pointClicked = data.points[0];
        if (this.props.onClick) {
            this.props.onClick(pointClicked.data.mxObjects[pointClicked.pointNumber], pointClicked.data.seriesIndex);
        }
    }

    private onHover(data: ScatterHoverData) {
        if (this.props.onHover) {
            const activePoint = data.points[0];
            const positionYaxis = activePoint.yaxis.l2p(activePoint.y) + activePoint.yaxis._offset;
            const positionXaxis = activePoint.xaxis.d2p(activePoint.x) + activePoint.xaxis._offset;
            this.tooltipNode.style.top = `${positionYaxis}px`;
            this.tooltipNode.style.left = `${positionXaxis}px`;
            this.tooltipNode.style.opacity = "1";
            this.props.onHover(this.tooltipNode, activePoint.data.mxObjects[activePoint.pointNumber]);
        }
    }

    private clearToolTip() {
        this.tooltipNode.innerHTML = "";
        this.tooltipNode.style.opacity = "0";
    }

    private onResize() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => {
            if (this.lineChartNode) {
                purge(this.lineChartNode);
                this.renderChart(this.props);
            }
            this.timeoutId = 0;
        }, 100);
    }
}
