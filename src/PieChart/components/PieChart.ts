// tslint:disable no-console
import { Component, ReactElement, createElement } from "react";
import * as classNames from "classnames";
import { newPlot, purge } from "../../PlotlyCustom";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { PieChartContainerProps } from "./PieChartContainer";
import { RuntimeEditor } from "../../components/RuntimeEditor";

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

interface PieChartState {
    layoutOptions: string;
    dataOptions: string;
}

export interface PieTraces {
    labels: string[];
    colors: string[];
    values: number[];
}

export class PieChart extends Component<PieChartProps, PieChartState> {
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
        this.onRuntimeUpdate = this.onRuntimeUpdate.bind(this);
        this.state = {
            layoutOptions: props.layoutOptions,
            dataOptions: props.dataOptions
        };
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
        if (this.props.devMode) {
            return createElement(RuntimeEditor, {
                supportSeries: false,
                layoutOptions: this.state.layoutOptions || "{\n\n}",
                dataOptions: this.state.dataOptions || "{\n\n}",
                modelerConfigs: JSON.stringify({ autosize: true, showlegend: this.props.showLegend }, null, 4),
                traces: this.getTraces(this.props.data),
                onChange: this.onRuntimeUpdate
            }, this.renderChartNode());
        }

        return this.renderChartNode();
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

    private renderChartNode() {
        return createElement("div",
            {
                className: classNames(`widget-charts-${this.props.chartType}`, this.props.class),
                ref: this.getPlotlyNodeRef,
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) }
            },
            createElement("div", { className: "widget-charts-tooltip", ref: this.getTooltipNodeRef })
        );
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
            const advancedOptions = this.state.dataOptions ? JSON.parse(this.state.dataOptions) : {};
            const traces = this.getTraces(props.data);

            const dataOptions = [ deepMerge.all([ {
                hole: this.props.chartType === "donut" ? 0.4 : 0,
                hoverinfo: this.props.tooltipForm ? "none" : "label",
                labels: traces.labels,
                marker: { colors: traces.colors },
                type: "pie",
                values: traces.values,
                sort: false
            }, advancedOptions ]) ];

            console.log("Data Options: ", dataOptions);
            return dataOptions as PieData[];
        }

        console.log("Default Data: ", props.defaultData);
        return props.defaultData || [];
    }

    private getLayoutOptions(props: PieChartProps): Partial<Layout> {
        const advancedOptions = this.state.layoutOptions ? JSON.parse(this.state.layoutOptions) : {};

        return deepMerge.all([ {
            autosize: true,
            showlegend: props.showLegend,
            width: this.pieChartNode && this.pieChartNode.clientWidth,
            height: this.pieChartNode && this.pieChartNode.clientHeight,
            margin: {
                l: 60,
                r: 60,
                b: 60,
                t: 100,
                pad: 4
            }
        }, advancedOptions ]);
    }

    private getConfigOptions(props: PieChartProps): Partial<Config> {
        return { displayModeBar: props.showToolbar, doubleClick: false };
    }

    private getTraces(data?: mendix.lib.MxObject[]): PieTraces {
        if (data) {
            return {
                labels: data.map(mxObject => mxObject.get(this.props.nameAttribute) as string),
                colors: data.map(mxObject => mxObject.get(this.props.colorAttribute) as string),
                values: data.map(mxObject => parseFloat(mxObject.get(this.props.valueAttribute) as string))
            };
        }

        return { labels: [], colors: [], values: [] };
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

    private onRuntimeUpdate(layoutOptions: string, dataOptions: string) {
        this.setState({ layoutOptions, dataOptions });
    }
}
