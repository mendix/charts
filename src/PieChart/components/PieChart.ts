import { Component, ReactChild, ReactElement, createElement } from "react";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { Playground } from "../../components/Playground";
import { PlotlyChart } from "../../components/PlotlyChart";

import deepMerge from "deepmerge";
import { Container } from "../../utils/namespaces";
import { Config, Layout, PieData, PieHoverData, ScatterHoverData } from "plotly.js";
import { getDimensions, parseStyle } from "../../utils/style";
import PieChartContainerProps = Container.PieChartContainerProps;

import "../../ui/Charts.scss";

export interface PieChartProps extends PieChartContainerProps {
    data?: mendix.lib.MxObject[];
    defaultData?: PieData[];
    alertMessage?: ReactChild;
    loading?: boolean;
    onClick?: (props: PieChartProps, dataObject: mendix.lib.MxObject) => void;
    onHover?: (node: HTMLDivElement, dataObject: mendix.lib.MxObject) => void;
}

interface PieChartState {
    layoutOptions: string;
    dataOptions: string;
    playgroundLoaded: boolean;
}

export interface PieTraces {
    labels: string[];
    values: number[];
}

export class PieChart extends Component<PieChartProps, PieChartState> {
    private tooltipNode: HTMLDivElement;
    private Playground: typeof Playground;

    constructor(props: PieChartProps) {
        super(props);

        this.getTooltipNodeRef = this.getTooltipNodeRef.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onHover = this.onHover.bind(this);
        this.onRuntimeUpdate = this.onRuntimeUpdate.bind(this);
        this.state = {
            layoutOptions: props.layoutOptions,
            dataOptions: props.dataOptions,
            playgroundLoaded: false
        };
    }

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: `widget-charts-${this.props.chartType}-alert` },
                this.props.alertMessage
            );
        }
        if (this.props.loading) {
            return createElement(ChartLoading, { text: "Loading" });
        }
        if (this.props.devMode === "developer" && this.state.playgroundLoaded) {
            return this.renderPlayground();
        }

        return this.renderChart();
    }

    componentWillReceiveProps(newProps: PieChartProps) {
        if (newProps.devMode === "developer" && !this.state.playgroundLoaded) {
            this.loadPlaygroundComponent();
        }
    }

    private async loadPlaygroundComponent() {
        const { Playground: PlaygroundImport } = await import("../../components/Playground");
        this.Playground = PlaygroundImport;
        this.setState({ playgroundLoaded: true });
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
        if (props.data) {
            const advancedOptions = props.devMode !== "basic" && this.state.dataOptions
                ? JSON.parse(this.state.dataOptions)
                : {};
            const traces = this.getTraces(props.data);

            const arrayMerge = (_destinationArray: any[], sourceArray: any[]) => {
                return sourceArray;
            };

            return [ deepMerge.all([ {
                hole: this.props.chartType === "donut" ? 0.4 : 0,
                hoverinfo: this.props.tooltipForm ? "none" : "label",
                labels: traces.labels,
                marker: { colors: [ "#2CA1DD", "#76CA02", "#F99B1D", "#B765D1" ] },
                type: "pie",
                values: traces.values,
                sort: false
            }, advancedOptions ], { arrayMerge }) ];
        }

        return props.defaultData || [];
    }

    private renderPlayground(): ReactElement<any> {
        return createElement(this.Playground, {
            pie: {
                dataOptions: this.state.dataOptions || "{\n\n}",
                modelerDataConfigs: JSON.stringify(PieChart.getDefaultDataOptions(this.props), null, 4),
                chartData: this.getData(this.props),
                traces: this.getTraces(this.props.data),
                onChange: this.onRuntimeUpdate
            },
            layoutOptions: this.state.layoutOptions || "{\n\n}",
            modelerLayoutConfigs: JSON.stringify(PieChart.getDefaultLayoutOptions(this.props), null, 4)
        }, this.renderChart());
    }

    private getLayoutOptions(props: PieChartProps): Partial<Layout> {
        const advancedOptions = props.devMode !== "basic" && this.state.layoutOptions
            ? JSON.parse(this.state.layoutOptions)
            : {};

        return deepMerge.all([ PieChart.getDefaultLayoutOptions(props), advancedOptions ]);
    }

    private getTraces(data?: mendix.lib.MxObject[]): PieTraces {
        if (data) {
            return {
                labels: data.map(mxObject => mxObject.get(this.props.nameAttribute) as string),
                values: data.map(mxObject => parseFloat(mxObject.get(this.props.valueAttribute) as string))
            };
        }

        return { labels: [], values: [] };
    }

    private onClick({ points }: ScatterHoverData<any> | PieHoverData) {
        if (this.props.onClick && this.props.data) {
            this.props.onClick(this.props, this.props.data[points[0].pointNumber]);
        }
    }

    private onHover({ event, points }: ScatterHoverData<any> | PieHoverData) {
        if (this.props.onHover && this.props.data) {
            this.tooltipNode.innerHTML = "";
            this.tooltipNode.style.top = `${event.clientY - 100}px`;
            this.tooltipNode.style.left = `${event.clientX}px`;
            this.tooltipNode.style.opacity = "1";
            this.props.onHover(this.tooltipNode, this.props.data[points[0].pointNumber]);
        }
    }

    private onRuntimeUpdate(layoutOptions: string, dataOptions: string) {
        this.setState({ layoutOptions, dataOptions });
    }

    private static getConfigOptions(): Partial<Config> {
        return { displayModeBar: false, doubleClick: false };
    }

    public static getDefaultLayoutOptions(props: PieChartProps): Partial<Layout> {
        return {
            font: {
                family: "Open Sans, sans-serif",
                size: 12,
                color: "#FFF"
            },
            autosize: true,
            showlegend: props.showLegend,
            hoverlabel: {
                bgcolor: "#888",
                bordercolor: "#888",
                font: {
                    color: "#FFF"
                }
            },
            legend: {
                font: {
                    color: "#888"
                }
            },
            margin: {
                l: 60,
                r: 60,
                b: 60,
                t: 10,
                pad: 10
            }
        };
    }

    public static getDefaultDataOptions(props: PieChartProps): Partial<PieData> {
        return {
            hole: props.chartType === "donut" ? 0.4 : 0,
            hoverinfo: props.tooltipForm ? "none" : "label",
            marker: { colors: [ "#2CA1DD", "#76CA02", "#F99B1D", "#B765D1" ] },
            type: "pie",
            sort: false
        };
    }
}
