import { CSSProperties, Component, createElement } from "react";
import * as classNames from "classnames";

import { ChartLoading } from "./ChartLoading";
import { HoverTooltip } from "./HoverTooltip";
import deepMerge from "deepmerge";
import * as elementResize from "element-resize-detector";
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

export class PlotlyChart extends Component<PlotlyChartProps, { loading: boolean }> {
    state = { loading: true };
    private chartNode?: HTMLDivElement;
    private tooltipNode?: HTMLDivElement;
    private timeoutId?: number;
    private resizeDetector = elementResize({ strategy: "scroll" });
    private newPlot?: (root: Root, data: Data[], layout?: Partial<Layout>, config?: Partial<Config>) => Promise<PlotlyHTMLElement>;
    private purge?: (root: Root) => void;

    render() {
        return createElement("div",
            {
                className: classNames(`widget-charts widget-charts-${this.props.type}`, this.props.className),
                ref: this.getPlotlyNodeRef,
                style: this.props.style
            },
            createElement("div", { className: "widget-charts-tooltip", ref: this.getTooltipNodeRef }),
            this.state.loading ? createElement(ChartLoading) : null
        );
    }

    componentDidMount() {
        if (this.chartNode && this.chartNode.parentElement) {
            this.chartNode.parentElement.classList.add("widget-charts-wrapper");
            if (this.props.onRender) {
                this.props.onRender(this.chartNode);
            }
        }
        this.renderChart(this.props);
        this.addResizeListener();
    }

    componentDidUpdate() {
        this.renderChart(this.props);
    }

    componentWillUnmount() {
        if (this.chartNode && this.purge) {
            this.purge(this.chartNode);
        }
    }

    private getPlotlyNodeRef = (node: HTMLDivElement) => {
        this.chartNode = node;
    }

    private getTooltipNodeRef = (node: HTMLDivElement) => {
        this.tooltipNode = node;
        if (this.props.getTooltipNode) {
            this.props.getTooltipNode(node);
        }
    }

    private async renderChart({ config, data, layout, onClick, onHover, onRestyle }: PlotlyChartProps) {
        if (this.chartNode) {
            const layoutOptions = deepMerge.all([ layout, getDimensionsFromNode(this.chartNode) ]);
            this.loadPlotlyAPI()
                .then(() => {
                    if (!this.state.loading && this.newPlot && this.chartNode) {
                        this.newPlot(this.chartNode, data as Data[], layoutOptions, config)
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
                });
        }
    }

    private async loadPlotlyAPI() {
        if (!this.newPlot || this.purge) {
            if (this.props.type === "full") {
                const { newPlot, purge } = await import("plotly.js/dist/plotly");
                this.newPlot = newPlot;
                this.purge = purge;
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
                if (this.props.type === "polar") {
                    register([ await import("plotly.js/lib/scatterpolar") ]);
                }
                this.newPlot = newPlot;
                this.purge = purge;
            }
        }
        if (this.state.loading) {
            this.setState({ loading: false });
        }
    }

    private addResizeListener() {
        if (this.chartNode && this.chartNode.parentElement) {
            this.resizeDetector.removeListener(this.chartNode.parentElement, this.onResize);
            this.resizeDetector.listenTo(this.chartNode.parentElement, this.onResize);
        }
    }

    private clearTooltip = () => {
        if (this.tooltipNode) {
            this.tooltipNode.style.opacity = "0";
        }
    }

    private onResize = async () => {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = window.setTimeout(() => {
            if (this.chartNode && this.purge) {
                this.purge(this.chartNode);
                this.renderChart(this.props);
                if (this.props.onResize) {
                    this.props.onResize(this.chartNode);
                }
            }
            this.timeoutId = 0;
        }, 100);
    }
}
