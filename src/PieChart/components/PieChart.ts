import { CSSProperties, Component, createElement } from "react";
import * as classNames from "classnames";
import { newPlot, purge } from "../../PlotlyCustom";

import * as elementResize from "element-resize-detector";
import { PieData, PieHoverData } from "plotly.js";
import { ChartType } from "./PieChartContainer";
import { Dimensions, getDimensions } from "../../utils/style";

import "../../ui/Charts.scss";

export interface PieChartProps extends Dimensions {
    data?: PieData[];
    config?: Partial<Plotly.Config>;
    layout?: Partial<Plotly.Layout>;
    type: ChartType;
    className?: string;
    style?: CSSProperties;
    onClick?: () => void;
    onHover?: (node: HTMLDivElement, index: number) => void;
}

export class PieChart extends Component<PieChartProps, {}> {
    private pieChartNode: HTMLDivElement;
    private tooltipNode: HTMLDivElement;
    private timeoutId: number;
    private data: PieData[] = [ {
        hole: this.props.type === "donut" ? .4 : 0,
        hoverinfo: "label+name",
        labels: [ "US", "China", "European Union", "Russian Federation", "Brazil", "India", "Rest of World" ],
        name: "GHG Emissions",
        type: "pie",
        values: [ 16, 15, 12, 6, 5, 4, 42 ]
    } ];

    constructor(props: PieChartProps) {
        super(props);

        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
        this.getTooltipNodeRef = this.getTooltipNodeRef.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onHover = this.onHover.bind(this);
        this.clearToolTip = this.clearToolTip.bind(this);
    }

    render() {
        return createElement("div",
            {
                className: classNames(`widget-charts-${this.props.type}`, this.props.className),
                ref: this.getPlotlyNodeRef,
                style: { ...getDimensions(this.props), ...this.props.style }
            },
            createElement("div", { className: "widget-charts-tooltip", ref: this.getTooltipNodeRef })
        );
    }

    componentDidMount() {
        this.renderChart(this.props);
        this.addResizeListener();
    }

    componentWillReceiveProps(newProps: PieChartProps) {
        this.renderChart(newProps);
    }

    componentWillUnmount() {
        if (this.pieChartNode) {
            purge(this.pieChartNode);
        }
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.pieChartNode = node;
    }

    private getTooltipNodeRef(node: HTMLDivElement) {
        this.tooltipNode = node;
    }

    private renderChart(props: PieChartProps) {
        if (this.pieChartNode) {
            const data = props.data && props.data[0].values.length ? props.data : this.data;
            newPlot(this.pieChartNode, data as any, props.layout, props.config)
                .then(myPlot => {
                    myPlot.on("plotly_click", this.onClick);
                    myPlot.on("plotly_hover", this.onHover);
                    myPlot.on("plotly_unhover", this.clearToolTip);
                });
        }
    }

    private onClick() {
        if (this.props.onClick) {
            this.props.onClick();
        }
    }

    private onHover(data: PieHoverData) {
        if (this.props.onHover) {
            const activePoint = data.points[0];
            this.tooltipNode.innerHTML = "";
            this.tooltipNode.style.top = `${data.event.pageY - 100}px`;
            this.tooltipNode.style.left = `${data.event.pageX - 60}px`;
            this.tooltipNode.style.opacity = "1";
            this.props.onHover(this.tooltipNode, activePoint.pointNumber);
        }
    }

    private clearToolTip() {
        this.tooltipNode.innerHTML = "";
        this.tooltipNode.style.opacity = "0";
    }

    private addResizeListener() {
        const resizeDetector = elementResize({ strategy: "scroll" });
        if (this.pieChartNode.parentElement) {
            resizeDetector.listenTo(this.pieChartNode.parentElement, () => {
                if (this.timeoutId) {
                    clearTimeout(this.timeoutId);
                }
                this.timeoutId = setTimeout(() => {
                    purge(this.pieChartNode);
                    this.renderChart(this.props);
                    this.timeoutId = 0;
                }, 100);
            });
        }
    }
}
