import { CSSProperties, Component, createElement } from "react";
import * as classNames from "classnames";

import { ChartLoading } from "./ChartLoading";
import deepMerge from "deepmerge";
import ReactResizeDetector from "react-resize-detector";
import {
    Config, Data, HeatMapData, Layout, PieData, PieHoverData,
    PlotlyHTMLElement, Root, ScatterData, ScatterHoverData
} from "plotly.js";
import { getDimensionsFromNode } from "../utils/style";

export interface PlotlyChartProps {
    type: "line" | "bar" | "pie" | "heatmap" | "full" | "polar";
    layout: Partial<Layout>;
    data: ScatterData[] | PieData[] | HeatMapData[];
    config: Partial<Config>;
    className?: string;
    style?: CSSProperties;
    onClick?: (data: ScatterHoverData<any> | PieHoverData) => void;
    onHover?: (data: ScatterHoverData<any> | PieHoverData) => void;
    onRestyle?: (data: any) => void;
    getTooltipNode?: (node: HTMLDivElement) => void;
    onRender?: (node: HTMLDivElement) => void;
    onResize?: (node: HTMLDivElement) => void;
}

interface Plotly {
    newPlot: (root: Root, data: Data[], layout?: Partial<Layout>, config?: Partial<Config>) => Promise<PlotlyHTMLElement>;
    purge: (root: Root) => void;
    relayout?: (root: Root, layout: Partial<Layout>) => Promise<PlotlyHTMLElement>;
}

export class PlotlyChart extends Component<PlotlyChartProps, { loading: boolean }> {
    state = { loading: true };
    private chartNode?: HTMLDivElement;
    private tooltipNode?: HTMLDivElement;
    private timeoutId?: number;
    private plotly?: Plotly;

    render() {
        return createElement("div",
            {
                className: classNames(`widget-charts widget-charts-${this.props.type}`, this.props.className),
                ref: this.getPlotlyNodeRef,
                style: this.props.style
            },
            createElement(ReactResizeDetector, { handleWidth: true, handleHeight: true, onResize: this.onResize }),
            createElement("div", { className: "widget-charts-tooltip", ref: this.getTooltipNodeRef }),
            this.state.loading ? createElement(ChartLoading) : null
        );
    }

    componentDidMount() {
        if (this.chartNode && this.chartNode.parentElement) {
            this.chartNode.parentElement.classList.add("widget-charts-wrapper");
        }
        this.fetchPlotly()
            .then(plotly => {
                this.plotly = plotly;
                if (this.props.onRender && this.chartNode) {
                    this.props.onRender(this.chartNode);
                }
                this.setState({ loading: false });
            });
    }

    componentDidUpdate() {
        if (this.plotly) {
            this.renderChart(this.props, this.plotly);
        }
    }

    componentWillUnmount() {
        if (this.chartNode && this.plotly) {
            this.plotly.purge(this.chartNode);
        }
    }

    private getPlotlyNodeRef = (node: HTMLDivElement) => {
        if (node) {
            this.chartNode = node;
        }
    }

    private getTooltipNodeRef = (node: HTMLDivElement) => {
        this.tooltipNode = node;
        if (this.props.getTooltipNode) {
            this.props.getTooltipNode(node);
        }
    }

    private renderChart({ config, data, layout, onClick, onHover, onRestyle }: PlotlyChartProps, plotly: Plotly) {
        if (this.chartNode && !this.state.loading) {
            const layoutOptions = deepMerge.all([ layout, getDimensionsFromNode(this.chartNode) ]);
            const plotlyConfig = window.dojo && window.dojo.locale
                ? { ...config, locale: window.dojo.locale }
                : config;
            plotly.newPlot(this.chartNode, data as Data[], layoutOptions, plotlyConfig)
                .then(myPlot => {
                    if (onClick) {
                        myPlot.on("plotly_click", onClick as any);
                    }
                    if (onHover) {
                        myPlot.on("plotly_hover", onHover as any);
                    }
                    myPlot.on("plotly_unhover", this.clearTooltip);
                    if (onRestyle) {
                        myPlot.on("plotly_restyle", onRestyle as any);
                    }
                });
        }
    }

    private async fetchPlotly(): Promise<Plotly> {
        if (this.props.type === "full") {
            const { newPlot, purge } = await import("plotly.js/dist/plotly");

            return { newPlot, purge };
        } else {
            const { newPlot, purge, register } = await import("../PlotlyCustom");
            if (this.props.type === "pie") {
                register([ await import("plotly.js/lib/pie") ]);
            }
            if (this.props.type === "bar" || this.props.type === "line") {
                register([ await import("plotly.js/lib/bar"), await import("plotly.js/lib/scatter") ]);
            }
            if (this.props.type === "heatmap") {
                register([ await import("plotly.js/lib/heatmap") ]);
            }

            return { newPlot, purge };
        }
    }

    private clearTooltip = () => {
        if (this.tooltipNode) {
            this.tooltipNode.style.opacity = "0";
        }
    }

    private onResize = () => {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = window.setTimeout(() => {
            if (this.plotly && this.chartNode) {
                this.renderChart(this.props, this.plotly);
                if (this.props.onResize) {
                    this.props.onResize(this.chartNode);
                }
            }
        }, 100);
    }
}
