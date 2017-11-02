// tslint:disable no-console
import { Component, ReactElement, createElement } from "react";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { PieChartContainerProps } from "./PieChartContainer";
import { Playground } from "../../components/Playground";
import { PlotlyChart } from "../../components/PlotlyChart";

import deepMerge from "deepmerge";
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
    private tooltipNode: HTMLDivElement;

    constructor(props: PieChartProps) {
        super(props);

        this.getTooltipNodeRef = this.getTooltipNodeRef.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onHover = this.onHover.bind(this);
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
        if (this.props.devMode === "advancedDev") {
            return createElement(Playground, {
                supportSeries: false,
                layoutOptions: this.state.layoutOptions || "{\n\n}",
                dataOptions: this.state.dataOptions || "{\n\n}",
                chartData: this.getData(this.props),
                modelerLayoutConfigs: JSON.stringify({ autosize: true, showlegend: this.props.showLegend }, null, 4),
                traces: this.getTraces(this.props.data),
                onChange: this.onRuntimeUpdate
            }, this.renderChart());
        }

        return this.renderChart();
    }

    componentDidMount() {
        if (!this.props.loading) {
            this.renderChart();
        }
    }

    componentDidUpdate() {
        if (!this.props.loading) {
            this.renderChart();
        }
    }

    private getTooltipNodeRef(node: HTMLDivElement) {
        this.tooltipNode = node;
    }

    private renderChart() {
        return createElement(PlotlyChart,
            {
                type: "pie",
                className: this.props.class,
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) },
                layout: this.getLayoutOptions(this.props),
                data: this.getData(this.props),
                config: PieChart.getConfigOptions(),
                onClick: this.onClick,
                onHover: this.onHover,
                getTooltipNode: this.getTooltipNodeRef
            }
        );
    }

    private getData(props: PieChartProps): PieData[] {
        let data: PieData[] = props.defaultData || [];
        if (props.data) {
            const advancedOptions = this.state.dataOptions ? JSON.parse(this.state.dataOptions) : {};
            const traces = this.getTraces(props.data);

            data = [ deepMerge.all([ {
                hole: this.props.chartType === "donut" ? 0.4 : 0,
                hoverinfo: this.props.tooltipForm ? "none" : "label",
                labels: traces.labels,
                marker: { colors: traces.colors },
                type: "pie",
                values: traces.values,
                sort: false
            }, advancedOptions ]) ];
        }

        console.log("Data Options: ", data);
        return data;
    }

    private getLayoutOptions(props: PieChartProps): Partial<Layout> {
        const advancedOptions = this.state.layoutOptions ? JSON.parse(this.state.layoutOptions) : {};

        return deepMerge.all([ {
            autosize: true,
            showlegend: props.showLegend,
            margin: {
                l: 60,
                r: 60,
                b: 60,
                t: 0,
                pad: 4
            }
        }, advancedOptions ]);
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

    private onRuntimeUpdate(layoutOptions: string, dataOptions: string) {
        this.setState({ layoutOptions, dataOptions });
    }

    private static getConfigOptions(): Partial<Config> {
        return { displayModeBar: false, doubleClick: false };
    }
}
