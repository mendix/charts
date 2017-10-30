import { CSSProperties, Component, createElement } from "react";
import * as classNames from "classnames";

import deepMerge from "deepmerge";
import * as elementResize from "element-resize-detector";
import { Config, Layout, PieData, PieHoverData, ScatterData, ScatterHoverData } from "plotly.js";
import { newPlot, purge } from "../PlotlyCustom";

interface PlotlyChartProps {
    type: "line" | "bar" | "pie";
    layout: Partial<Layout>;
    data: ScatterData[] | PieData[];
    config: Partial<Config>;
    className?: string;
    style?: CSSProperties;
    onClick?: (data: ScatterHoverData<any> | PieHoverData) => void;
    onHover?: (data: ScatterHoverData<any> | PieHoverData) => void;
    getTooltipNode?: (node: HTMLDivElement) => void;
}

export class PlotlyChart extends Component<PlotlyChartProps, {}> {
    private chartNode?: HTMLDivElement;
    private tooltipNode: HTMLDivElement;
    private timeoutId: number;
    private resizeDetector = elementResize({ strategy: "scroll" });

    constructor(props: PlotlyChartProps) {
        super(props);

        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
        this.getTooltipNodeRef = this.getTooltipNodeRef.bind(this);
        this.clearToolTip = this.clearToolTip.bind(this);
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
        this.renderChart(this.props);
        this.addResizeListener();
    }

    componentDidUpdate() {
        this.renderChart(this.props);
    }

    componentWillUnmount() {
        if (this.chartNode) {
            purge(this.chartNode);
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
            const layoutOptions = deepMerge.all([
                layout,
                {
                    width: this.chartNode.clientWidth,
                    height: this.chartNode.clientHeight
                }
            ]);
            newPlot(this.chartNode, data as any, layoutOptions, config)
                .then(myPlot => {
                    myPlot.on("plotly_click", onClick as any);
                    myPlot.on("plotly_hover", onHover as any);
                    myPlot.on("plotly_unhover", this.clearToolTip);
                });
        }
    }

    private addResizeListener() {
        if (this.chartNode && this.chartNode.parentElement) {
            this.resizeDetector.removeListener(this.chartNode.parentElement, this.onResize);
            this.resizeDetector.listenTo(this.chartNode.parentElement, this.onResize);
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
            if (this.chartNode) {
                purge(this.chartNode);
                this.renderChart(this.props);
            }
            this.timeoutId = 0;
        }, 100);
    }
}
