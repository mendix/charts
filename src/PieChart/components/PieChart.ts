// tslint:disable no-console
import { Component, ReactElement, createElement } from "react";
import * as classNames from "classnames";
import { newPlot, purge } from "../../PlotlyCustom";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { PieChartContainerProps } from "./PieChartContainer";

import deepMerge from "deepmerge";
import * as elementResize from "element-resize-detector";
import { Config, Layout, PieData, PieHoverData } from "plotly.js";
import { getDimensions, parseStyle } from "../../utils/style";

import "../../ui/Charts.scss";

export interface PieChartProps extends PieChartContainerProps {
    data?: mendix.lib.MxObject[];
    defaultData?: PieData[];
    alertMessage?: string | ReactElement<any>;
    loading?: boolean;
    onClick?: (index: number) => void;
    onHover?: (node: HTMLDivElement, index: number) => void;
}

export class PieChart extends Component<PieChartProps, {}> {
    private pieChartNode?: HTMLDivElement;
    private tooltipNode: HTMLDivElement;
    private timeoutId: number;
    private resizeDetector = elementResize({ strategy: "scroll" });

    constructor(props: PieChartProps) {
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
                className: `widget-charts-${this.props.chartType}-alert`,
                message: this.props.alertMessage
            });
        }
        if (this.props.loading) {
            return createElement(ChartLoading, { text: "Loading" });
        }

        return createElement("div",
            {
                className: classNames(`widget-charts-${this.props.chartType}`, this.props.class),
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
            newPlot(this.pieChartNode, this.getData(props) as any, this.getLayoutOptions(props), this.getConfigOptions(props)) // tslint:disable-line
                .then(myPlot => {
                    myPlot.on("plotly_click", this.onClick);
                    myPlot.on("plotly_hover", this.onHover);
                    myPlot.on("plotly_unhover", this.clearToolTip);
                });
        }
    }

    private getData(props: PieChartProps): PieData[] {
        if (props.data) {
            const advancedOptions = this.props.dataOptions ? JSON.parse(this.props.dataOptions) : {};

            const dataOptions = [ deepMerge.all([ {
                hole: this.props.chartType === "donut" ? 0.4 : 0,
                hoverinfo: this.props.tooltipForm ? "none" : "label",
                labels: props.data.map(value => value.get(this.props.nameAttribute) as string),
                marker: {
                    colors: props.data.map(value => value.get(this.props.colorAttribute) as string)
                },
                type: "pie",
                values: props.data.map(value => parseFloat(value.get(this.props.valueAttribute) as string)),
                sort: false
            }, advancedOptions ]) ];

            console.log("Data Options: ", dataOptions);
            return dataOptions as PieData[];
        }

        console.log("Default Data: ", props.defaultData);
        return props.defaultData || [];
    }

    private getLayoutOptions(props: PieChartProps): Partial<Layout> {
        const advancedOptions = props.layoutOptions ? JSON.parse(props.layoutOptions) : {};

        return deepMerge.all([ {
            autosize: true,
            showlegend: props.showLegend,
            width: this.pieChartNode && this.pieChartNode.clientWidth,
            height: this.pieChartNode && this.pieChartNode.clientHeight
        }, advancedOptions ]);
    }

    private getConfigOptions(props: PieChartProps): Partial<Config> {
        return { displayModeBar: props.showToolbar, doubleClick: false };
    }

    private onClick(data: PieHoverData) {
        if (this.props.onClick) {
            const activePoint = data.points[0];
            this.props.onClick(activePoint.pointNumber);
        }
    }

    private onHover(data: PieHoverData) {
        if (this.props.onHover) {
            const activePoint = data.points[0];
            this.tooltipNode.innerHTML = "";
            this.tooltipNode.style.top = `${data.event.clientY - 100}px`;
            this.tooltipNode.style.left = `${data.event.clientX}px`;
            this.tooltipNode.style.opacity = "1";
            this.props.onHover(this.tooltipNode, activePoint.pointNumber);
        }
    }

    private clearToolTip() {
        this.tooltipNode.innerHTML = "";
        this.tooltipNode.style.opacity = "0";
    }

    private addResizeListener() {
        if (this.pieChartNode && this.pieChartNode.parentElement) {
            this.resizeDetector.removeListener(this.pieChartNode.parentElement, this.onResize);
            this.resizeDetector.listenTo(this.pieChartNode.parentElement, this.onResize);
        }
    }

    private onResize() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => {
            if (this.pieChartNode) {
                purge(this.pieChartNode);
                this.renderChart(this.props);
            }
            this.timeoutId = 0;
        }, 100);
    }
}
