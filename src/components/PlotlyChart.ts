import { CSSProperties, Component, createElement } from "react";
import * as classNames from "classnames";

import deepMerge from "deepmerge";
import * as elementResize from "element-resize-detector";
import { Config, Data, HeatMapData, Layout, PieData, PieHoverData, ScatterData, ScatterHoverData } from "plotly.js";

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

export class PlotlyChart extends Component<PlotlyChartProps, {}> {
    private chartNode?: HTMLDivElement;
    private tooltipNode?: HTMLDivElement;
    private timeoutId: number;
    private resizeDetector = elementResize({ strategy: "scroll" });

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
            createElement("div", { className: "widget-charts-tooltip", ref: this.getTooltipNodeRef })
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
        import(this.props.type === "any" ? "plotly.js/dist/plotly" : "../PlotlyCustom").then(({ purge }) => {
            if (this.chartNode) {
                purge(this.chartNode);
            }
        });
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

    private async renderChart({ config, data, layout, onClick, onHover }: PlotlyChartProps) {
        if (this.chartNode) {
            const style = window.getComputedStyle(this.chartNode);

            const layoutOptions = deepMerge.all([
                layout,
                {
                    width: parseFloat(style.getPropertyValue("width").split("px")[0]),
                    height: parseFloat(style.getPropertyValue("height").split("px")[0])
                }
            ]);
            const { newPlot } = this.props.type === "any"
                ? await import("plotly.js/dist/plotly")
                : await import("../PlotlyCustom");
            newPlot(this.chartNode, data as Data[], layoutOptions, config)
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

    private onResize() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => {
            import(this.props.type === "any" ? "plotly.js/dist/plotly" : "../PlotlyCustom").then(({ purge }) => {
                if (this.chartNode) {
                    purge(this.chartNode);
                    this.renderChart(this.props);
                }
                this.timeoutId = 0;
            });
        }, 100);
    }
}
