import { Component, ReactChild, ReactElement, createElement } from "react";

import { Alert } from "../../components/Alert";
import { BarChartContainerProps } from "./BarChartContainer";
import { ChartLoading } from "../../components/ChartLoading";
import { Playground } from "../../components/Playground";
import { PlotlyChart } from "../../components/PlotlyChart";

import { SeriesData, SeriesProps, getRuntimeTraces, getSeriesTraces } from "../../utils/data";
import deepMerge from "deepmerge";
import { Config, Layout, ScatterData, ScatterHoverData } from "plotly.js";
import { getDimensions, parseStyle } from "../../utils/style";

import "../../ui/Charts.scss";

export interface BarChartProps extends BarChartContainerProps {
    alertMessage?: ReactChild;
    loading?: boolean;
    data?: SeriesData[];
    defaultData?: ScatterData[];
    onClick?: (series: SeriesProps, dataObject: mendix.lib.MxObject) => void;
    onHover?: (node: HTMLDivElement, tooltipForm: string, dataObject: mendix.lib.MxObject) => void;
}

interface BarChartState {
    layoutOptions: string;
    data?: SeriesData[];
}

export class BarChart extends Component<BarChartProps, BarChartState> {
    private tooltipNode: HTMLDivElement;
    private defaultColors: string[] = [ "#2CA1DD", "#76CA02", "#F99B1D", "#B765D1" ];

    constructor(props: BarChartProps) {
        super(props);

        this.getTooltipNodeRef = this.getTooltipNodeRef.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onHover = this.onHover.bind(this);
        this.onRuntimeUpdate = this.onRuntimeUpdate.bind(this);
        this.state = {
            layoutOptions: props.layoutOptions,
            data: props.data
        };
    }

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: "widget-charts-bar-alert" }, this.props.alertMessage);
        }
        if (this.props.loading) {
            return createElement(ChartLoading, { text: "Loading" });
        }
        if (this.props.devMode === "developer") {
            return this.renderPlayground();
        }

        return this.renderChart();
    }

    componentWillReceiveProps(newProps: BarChartProps) {
        this.setState({
            layoutOptions: newProps.layoutOptions,
            data: newProps.data
        });
    }

    private getTooltipNodeRef(node: HTMLDivElement) {
        this.tooltipNode = node;
    }

    private renderChart() {
        return createElement(PlotlyChart,
            {
                type: "bar",
                className: this.props.class,
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) },
                layout: this.getLayoutOptions(this.props),
                data: this.getData(this.props),
                config: BarChart.getConfigOptions(),
                onClick: this.onClick,
                onHover: this.onHover,
                getTooltipNode: this.getTooltipNodeRef
            }
        );
    }

    private renderPlayground(): ReactElement<any> {
        return createElement(Playground, {
            series: {
                rawData: this.state.data,
                chartData: this.getData(this.props),
                modelerSeriesConfigs: this.state.data && this.state.data.map(({ series }) =>
                    JSON.stringify(BarChart.getDefaultSeriesOptions(series, this.props), null, 4)
                ),
                traces: this.state.data && this.state.data.map(getRuntimeTraces),
                onChange: this.onRuntimeUpdate
            },
            layoutOptions: this.state.layoutOptions || "{\n\n}",
            modelerLayoutConfigs: JSON.stringify(BarChart.defaultLayoutConfigs(this.props), null, 4)
        }, this.renderChart());
    }

    private getLayoutOptions(props: BarChartProps): Partial<Layout> {
        const advancedOptions = props.devMode !== "basic" && this.state.layoutOptions
            ? JSON.parse(this.state.layoutOptions)
            : {};

        return deepMerge.all([ BarChart.defaultLayoutConfigs(props), advancedOptions ]);
    }

    private getData(props: BarChartProps): ScatterData[] {
        if (props.data) {
            return props.data.map(({ data, series }, index) => {
                const rawOptions = props.devMode !== "basic" && series.seriesOptions
                    ? JSON.parse(series.seriesOptions)
                    : {};
                const traces = getSeriesTraces({ data, series });
                const configOptions: Partial<ScatterData> = {
                    x: props.orientation === "bar" ? traces.y : traces.x,
                    y: props.orientation === "bar" ? traces.x : traces.y,
                    series,
                    marker: index < this.defaultColors.length ? { color: this.defaultColors[index] } : undefined,
                    ... BarChart.getDefaultSeriesOptions(series, props)
                };

                // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
                return {
                    ...deepMerge.all<ScatterData>([ configOptions, rawOptions ]),
                    customdata: data
                };
            });
        }

        return props.defaultData || [];
    }

    private onClick(data: ScatterHoverData<mendix.lib.MxObject>) {
        const pointClicked = data.points[0];
        if (this.props.onClick) {
            this.props.onClick(pointClicked.data.series, pointClicked.customdata);
        }
    }

    private onHover({ points }: ScatterHoverData<mendix.lib.MxObject>) {
        const { customdata, data, x, xaxis, y, yaxis } = points[0];
        if (this.props.onHover && data.series.tooltipForm) {
            const yAxisPixels = typeof y === "number" ? yaxis.l2p(y) : yaxis.d2p(y);
            const xAxisPixels = typeof x === "number" ? xaxis.l2p(x as number) : xaxis.d2p(x);
            const positionYaxis = yAxisPixels + yaxis._offset;
            const positionXaxis = xAxisPixels + xaxis._offset;
            this.tooltipNode.style.top = `${positionYaxis}px`;
            this.tooltipNode.style.left = `${positionXaxis}px`;
            this.tooltipNode.style.opacity = "1";
            this.props.onHover(this.tooltipNode, data.series.tooltipForm, customdata);
        }
    }

    private onRuntimeUpdate(layoutOptions: string, data: SeriesData[]) {
        this.setState({ layoutOptions, data });
    }

    private static getConfigOptions(): Partial<Config> {
        return { displayModeBar: false, doubleClick: false };
    }

    private static getDefaultSeriesOptions(series: SeriesProps, props: BarChartProps): Partial<ScatterData> {
        const hoverinfo = (props.orientation === "bar" ? "x" : "y") as any;

        return {
            name: series.name,
            type: "bar",
            hoverinfo: series.tooltipForm ? "text" : hoverinfo, // typings don't have a hoverinfo value of "y"
            orientation: props.orientation === "bar" ? "h" : "v"
        };
    }

    public static defaultLayoutConfigs(props: BarChartProps): Partial<Layout> {
        return {
            font: {
                family: "Open Sans, sans-serif",
                size: 12,
                color: "#888"
            },
            autosize: true,
            barmode: props.barMode,
            hovermode: "closest",
            showlegend: props.showLegend,
            xaxis: {
                gridcolor: "#eaeaea",
                title: props.xAxisLabel,
                showgrid: props.grid === "vertical" || props.grid === "both",
                fixedrange: true
            },
            yaxis: {
                rangemode: "tozero",
                zeroline: true,
                zerolinecolor: "#eaeaea",
                gridcolor: "#eaeaea",
                title: props.yAxisLabel,
                showgrid: props.grid === "horizontal" || props.grid === "both",
                fixedrange: true
            },
            hoverlabel: {
                bgcolor: "#888",
                bordercolor: "#888",
                font: {
                    color: "#FFF"
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
}
