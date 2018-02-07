import { CSSProperties, Component, createElement } from "react";
import * as classNames from "classnames";

import { ChartLoading } from "./ChartLoading";
import deepMerge from "deepmerge";
import * as elementResize from "element-resize-detector";
import {
    Config, Data, HeatMapData, Layout, PieData, PieHoverData,
    PlotlyHTMLElement, Root, ScatterData, ScatterHoverData
} from "plotly.js";

export interface PlotlyChartProps {
    type: "line" | "bar" | "pie" | "any";
    layout: Partial<Layout>;
    data: ScatterData[] | PieData[] | HeatMapData[];
    config: Partial<Config>;
    className?: string;
    style?: CSSProperties;
    onClick?: (data: ScatterHoverData<any> | PieHoverData) => void;
    onHover?: (data: ScatterHoverData<any> | PieHoverData) => void;
    getTooltipNode?: (node: HTMLDivElement) => void;
}

export class PlotlyChart extends Component<PlotlyChartProps, { loading: boolean }> {
    state = { loading: true };
    private chartNode?: HTMLDivElement;
    private tooltipNode?: HTMLDivElement;
    private timeoutId?: number;
    private resizeDetector = elementResize({ strategy: "scroll" });
    private newPlot?: (root: Root, data: Data[], layout?: Partial<Layout>, config?: Partial<Config>) => Promise<PlotlyHTMLElement>;
    private purge?: (root: Root) => void;

    constructor(props: PlotlyChartProps) {
        super(props);

        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
        this.getTooltipNodeRef = this.getTooltipNodeRef.bind(this);
        this.clearTooltip = this.clearTooltip.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    render() {
        return createElement("div",
            {
                className: classNames(`widget-charts widget-charts-${this.props.type}`, this.props.className),
                ref: this.getPlotlyNodeRef,
                style: this.props.style
            },
            createElement("div", { className: "widget-charts-tooltip", ref: this.getTooltipNodeRef }),
            this.state.loading ? createElement(ChartLoading, { text: "Loading" }) : null
        );
    }

    componentDidMount() {
        if (this.chartNode && this.chartNode.parentElement) {
            this.chartNode.parentElement.classList.add("widget-charts-wrapper");
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

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.chartNode = node;
    }

    private getTooltipNodeRef(node: HTMLDivElement) {
        this.tooltipNode = node;
        if (this.props.getTooltipNode) {
            this.props.getTooltipNode(node);
        }
    }

    private renderChart({ config, data, layout, onClick, onHover }: PlotlyChartProps) {
        if (this.chartNode) {
            const style = window.getComputedStyle(this.chartNode);

            const layoutOptions = deepMerge.all([
                layout,
                {
                    width: parseFloat(style.getPropertyValue("width").split("px")[0]),
                    height: parseFloat(style.getPropertyValue("height").split("px")[0])
                }
            ]);
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
                                    myPlot.on("plotly_unhover", this.clearTooltip);
                                }
                            });
                    }
                });
        }
    }

    private async loadPlotlyAPI() {
        if (!this.newPlot || this.purge) {
            const { newPlot, purge } = this.props.type === "any"
                    ? await import("plotly.js/dist/plotly")
                    : await import("../PlotlyCustom");
            this.newPlot = newPlot;
            this.purge = purge;
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

    private clearTooltip() {
        if (this.tooltipNode) {
            this.tooltipNode.innerHTML = "";
            this.tooltipNode.style.opacity = "0";
        }
    }

    private async onResize() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => {
            if (this.chartNode && this.purge) {
                this.purge(this.chartNode);
                this.renderChart(this.props);
            }
            this.timeoutId = 0;
        }, 100);
    }
}
