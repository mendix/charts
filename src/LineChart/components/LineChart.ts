import { Component, ReactElement, createElement } from "react";
import * as classNames from "classnames";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { LineChartContainerProps, SeriesProps } from "./LineChartContainer";

import deepMerge from "deepmerge";
import * as elementResize from "element-resize-detector";
import { Config, Datum, Layout, ScatterData, ScatterHoverData } from "plotly.js";
import { newPlot, purge } from "../../PlotlyCustom";
import { getDimensions, parseStyle } from "../../utils/style";

import "../../ui/Charts.scss";

export interface LineChartProps extends LineChartContainerProps {
    data?: Data[];
    defaultData?: ScatterData[];
    loading?: boolean;
    alertMessage?: string | ReactElement<any>;
    onClick?: (series: SeriesProps, dataObject: mendix.lib.MxObject) => void;
    onHover?: (node: HTMLDivElement, dataObject: mendix.lib.MxObject) => void;
}

export type Mode = "lines" | "markers" | "lines+markers" | "none";

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
            const data = this.getData(props);
            const scatterData = props.area === "stacked" ? this.getStackedArea(data) : data;
            newPlot(this.lineChartNode, scatterData, this.getLayoutOptions(props), this.getConfigOptions(props))
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
            hovermode: "closest",
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
                const { series } = data;
                const values = data.data.map(value => ({
                    x: value.get(series.xValueAttribute) as Datum,
                    y: parseInt(value.get(series.yValueAttribute) as string, 10) as Datum
                }));
                const rawOptions = series.seriesOptions ? JSON.parse(series.seriesOptions) : {};
                const configOptions = {
                    connectgaps: true,
                    hoveron: "points",
                    hoverinfo: props.tooltipForm ? "text" : undefined,
                    line: {
                        color: series.lineColor,
                        shape: series.lineStyle
                    },
                    mode: series.mode.replace("X", "+") as Mode,
                    name: series.name,
                    type: "scatter",
                    fill: props.fill ? "tonexty" : "none",
                    x: values.map(value => value.x),
                    y: values.map(value => value.y),
                    series: data.series
                };

                // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
                return { ...deepMerge.all<ScatterData>([ rawOptions, configOptions ]), mxObjects: data.data };
            });
        }

        return props.defaultData || [];
    }

    private getStackedArea(traces: ScatterData[]) {
        for (let i = 1; i < traces.length; i++) {
            for (let j = 0; j < (Math.min(traces[i].y.length, traces[i - 1].y.length)); j++) {
                (traces[i].y[j] as any) += traces[i - 1].y[j];
            }
        }

        return traces;
    }

    private onClick(data: ScatterHoverData) {
        const pointClicked = data.points[0];
        if (this.props.onClick) {
            this.props.onClick(pointClicked.data.series, pointClicked.data.mxObjects[pointClicked.pointNumber]);
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
