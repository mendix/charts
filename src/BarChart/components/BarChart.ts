// tslint:disable no-console
import { Component, ReactElement, createElement } from "react";
import * as classNames from "classnames";

import { Alert } from "../../components/Alert";
import { BarChartContainerProps, SeriesProps } from "./BarChartContainer";
import { ChartLoading } from "../../components/ChartLoading";

import deepMerge from "deepmerge";
import * as elementResize from "element-resize-detector";
import { Config, Layout, ScatterData, ScatterHoverData } from "plotly.js";
import { newPlot, purge } from "../../PlotlyCustom";
import { getDimensions, parseStyle } from "../../utils/style";

import "../../ui/Charts.scss";

export interface BarChartProps extends BarChartContainerProps {
    alertMessage?: string | ReactElement<any>;
    loading?: boolean;
    data?: Data[];
    defaultData?: ScatterData[];
    onClick?: (series: SeriesProps, dataObject: mendix.lib.MxObject) => void;
    onHover?: (node: HTMLDivElement, dataObject: mendix.lib.MxObject) => void;
}

export interface Data {
    data: mendix.lib.MxObject[];
    series: SeriesProps;
}

export class BarChart extends Component<BarChartProps, {}> {
    private barChartNode?: HTMLDivElement;
    private tooltipNode: HTMLDivElement;
    private timeoutId: number;

    constructor(props: BarChartProps) {
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
                className: "widget-charts-bar-alert",
                message: this.props.alertMessage
            });
        }
        if (this.props.loading) {
            return createElement(ChartLoading, { text: "Loading" });
        }

        return createElement("div",
            {
                className: classNames("widget-charts-bar", this.props.class),
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
        if (this.barChartNode) {
            purge(this.barChartNode);
        }
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.barChartNode = node;
    }

    private getTooltipNodeRef(node: HTMLDivElement) {
        this.tooltipNode = node;
    }

    private addResizeListener() {
        const resizeDetector = elementResize({ strategy: "scroll" });
        if (this.barChartNode && this.barChartNode.parentElement) {
            resizeDetector.listenTo(this.barChartNode.parentElement, this.onResize);
        }
    }

    private renderChart(props: BarChartProps) {
        if (this.barChartNode) {
            newPlot(this.barChartNode, this.getData(props), this.getLayoutOptions(props), this.getConfigOptions(props))
                .then(myPlot => {
                    myPlot.on("plotly_click", this.onClick);
                    myPlot.on("plotly_hover", this.onHover);
                    myPlot.on("plotly_unhover", this.clearToolTip);
                });
        }
    }

    private getLayoutOptions(props: BarChartProps): Partial<Layout> {
        const advancedOptions = props.layoutOptions ? JSON.parse(props.layoutOptions) : {};

        const layoutOptions = deepMerge.all([ {
            autosize: true,
            barmode: props.barMode,
            xaxis: {
                showgrid: props.grid === "vertical" || props.grid === "both",
                title: props.xAxisLabel,
                fixedrange: true
            },
            yaxis: {
                showgrid: props.grid === "horizontal" || props.grid === "both",
                title: props.yAxisLabel,
                fixedrange: true
            },
            showlegend: props.showLegend,
            hovermode: "closest",
            width: this.barChartNode && this.barChartNode.clientWidth,
            height: this.barChartNode && this.barChartNode.clientHeight
        }, advancedOptions ]);

        console.log("Layout Options:", layoutOptions);
        return layoutOptions;
    }

    private getConfigOptions(props: BarChartProps): Partial<Config> {
        return { displayModeBar: props.showToolbar, doubleClick: false };
    }

    private getData(props: BarChartProps): ScatterData[] {
        if (props.data) {
            const dataOptions = props.data.map(data => {
                const values = data.data.map(value => ({
                    x: value.get(data.series.xValueAttribute) as Plotly.Datum,
                    y: parseInt(value.get(data.series.yValueAttribute) as string, 10) as Plotly.Datum
                }));
                const x = values.map(value => value.x);
                const y = values.map(value => value.y);
                const rawOptions = data.series.seriesOptions ? JSON.parse(data.series.seriesOptions) : {};
                const configOptions = {
                    name: data.series.name,
                    type: "bar",
                    hoverinfo: this.props.tooltipForm ? "text" : undefined,
                    x: this.props.orientation === "bar" ? y : x,
                    y: this.props.orientation === "bar" ? x : y,
                    orientation: this.props.orientation === "bar" ? "h" : "v",
                    series: data.series
                };

                // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
                return { ...deepMerge.all<ScatterData>([ configOptions, rawOptions ]), mxObjects: data.data };
            });

            console.log("Data Options:", dataOptions);
            return dataOptions;
        }

        console.log("Default Data: ", props.defaultData);
        return props.defaultData || [];
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
            const yAxisPixels = typeof activePoint.y === "number"
                ? activePoint.yaxis.l2p(activePoint.y)
                : activePoint.yaxis.d2p(activePoint.y);
            const xAxisPixels = typeof activePoint.x === "number"
                ? activePoint.xaxis.l2p(activePoint.x as number)
                : activePoint.xaxis.d2p(activePoint.x);
            const positionYaxis = yAxisPixels + activePoint.yaxis._offset;
            const positionXaxis = xAxisPixels + activePoint.xaxis._offset;
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
            if (this.barChartNode) {
                purge(this.barChartNode);
                this.renderChart(this.props);
            }
            this.timeoutId = 0;
        }, 100);
    }
}
