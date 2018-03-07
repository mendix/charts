import { Component, ReactChild, ReactElement, createElement } from "react";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { SeriesPlayground } from "../../components/SeriesPlayground";
import { PlotlyChart } from "../../components/PlotlyChart";

import { getRuntimeTraces, getSeriesTraces } from "../../utils/data";
import deepMerge from "deepmerge";
import { Container, Data } from "../../utils/namespaces";
import { Config, Layout, ScatterData, ScatterHoverData } from "plotly.js";
import { getDimensions, parseStyle } from "../../utils/style";

import SeriesData = Data.SeriesData;
import BubbleChartContainerProps = Container.BubbleChartContainerProps;
import SeriesProps = Data.SeriesProps;
import LineSeriesProps = Data.LineSeriesProps;

import "../../ui/Charts.scss";

export interface BubbleChartProps extends BubbleChartContainerProps {
    scatterData?: ScatterData[];
    seriesOptions?: string[];
    loading?: boolean;
    alertMessage?: ReactChild;
    onClick?: (series: SeriesProps, dataObject: mendix.lib.MxObject, mxform: mxui.lib.form._FormBase) => void;
    onHover?: (node: HTMLDivElement, tooltipForm: string, dataObject: mendix.lib.MxObject) => void;
}

interface BubbleChartState {
    layoutOptions: string;
    series?: SeriesProps[];
    scatterData?: ScatterData[];
    seriesOptions?: string[];
    playgroundLoaded: boolean;
}

export class BubbleChart extends Component<BubbleChartProps, BubbleChartState> {
    state: BubbleChartState = {
        layoutOptions: this.props.layoutOptions,
        series: this.props.series,
        scatterData: this.props.scatterData,
        seriesOptions: this.props.seriesOptions,
        playgroundLoaded: false
    };
    private tooltipNode?: HTMLDivElement;
    private defaultColors: string[] = [ "#2CA1DD", "#76CA02", "#F99B1D", "#B765D1" ];
    private Playground?: typeof SeriesPlayground;

    constructor(props: BubbleChartProps) {
        super(props);

        if (props.devMode === "developer" && !this.state.playgroundLoaded) {
            this.loadPlaygroundComponent();
        }
    }
    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: "widget-charts-bubble-alert" }, this.props.alertMessage);
        }
        if (this.props.loading || (this.props.devMode === "developer" && !this.state.playgroundLoaded)) {
            return createElement(ChartLoading, { text: "Loading" });
        }
        if (this.props.devMode === "developer" && this.state.playgroundLoaded) {
            return this.renderPlayground();
        }

        return this.renderBubbleChart();
    }

    componentWillReceiveProps(newProps: BubbleChartProps) {
        this.setState({
            layoutOptions: newProps.layoutOptions,
            series: newProps.series,
            seriesOptions: newProps.seriesOptions,
            scatterData: newProps.scatterData
        });
    }

    private async loadPlaygroundComponent() {
        const { SeriesPlayground: PlaygroundImport } = await import("../../components/SeriesPlayground");
        this.Playground = PlaygroundImport;
        this.setState({ playgroundLoaded: true });
    }

    private renderBubbleChart(): ReactElement<any> {
        return createElement(PlotlyChart,
            {
                type: "bubble",
                className: this.props.class,
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) },
                layout: this.getLayoutOptions(this.props),
                data: this.getData(this.props),
                config: BubbleChart.getConfigOptions(),
                onClick: this.onClick,
                onHover: this.onHover,
                getTooltipNode: this.getTooltipNodeRef
            }
        );
    }

    private renderPlayground(): ReactElement<any> | null {
        if (this.Playground) {
            return createElement(this.Playground, {
                series: this.state.series,
                seriesOptions: this.state.seriesOptions,
                modelerSeriesConfigs: this.state.series && this.state.series.map(series =>
                    JSON.stringify(BubbleChart.getDefaultSeriesOptions(series as SeriesProps, this.props), null, 4)
                ),
                onChange: this.onRuntimeUpdate,
                layoutOptions: this.state.layoutOptions || "{\n\n}",
                modelerLayoutConfigs: JSON.stringify(BubbleChart.defaultLayoutConfigs(this.props), null, 4)
            }, this.renderBubbleChart());
        }

        return null;
    }

    private getTooltipNodeRef = (node: HTMLDivElement) => {
        this.tooltipNode = node;
    }

    private getLayoutOptions(props: BubbleChartProps): Partial<Layout> {
        const advancedOptions = props.devMode !== "basic" && this.state.layoutOptions
            ? JSON.parse(this.state.layoutOptions)
            : {};

        return deepMerge.all([ BubbleChart.defaultLayoutConfigs(props), advancedOptions ]);
    }

    private getData(props: BubbleChartProps): ScatterData[] {
        const { seriesOptions } = this.state;
        if (props.scatterData) {
            const chartData = props.scatterData.map((data, index) => {
                const parsedOptions = props.devMode !== "basic" && seriesOptions
                    ? JSON.parse(seriesOptions[index])
                    : {};

                // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
                return {
                    ...deepMerge.all<ScatterData>([ data, parsedOptions ]),
                    customdata: data.customdata
                };
            });

            return chartData;
        }

        return [];
    }

    private onClick = ({ points }: ScatterHoverData<mendix.lib.MxObject>) => {
        if (this.props.onClick) {
            this.props.onClick(points[0].data.series, points[0].customdata, this.props.mxform);
        }
    }

    private onHover = ({ points }: ScatterHoverData<mendix.lib.MxObject>) => {
        const { customdata, data, x, xaxis, y, yaxis } = points[0];
        if (this.props.onHover && data.series.tooltipForm && this.tooltipNode) {
            const positionYaxis = yaxis.l2p(y as number) + yaxis._offset;
            const positionXaxis = xaxis.d2p(x) + xaxis._offset;
            this.tooltipNode.style.top = `${positionYaxis}px`;
            this.tooltipNode.style.left = `${positionXaxis}px`;
            this.tooltipNode.style.opacity = "1";
            this.props.onHover(this.tooltipNode, data.series.tooltipForm, customdata);
        }
    }

    private onRuntimeUpdate = (layoutOptions: string, seriesOptions: string[]) => {
        this.setState({ layoutOptions, seriesOptions });
    }

    public static defaultLayoutConfigs(props: BubbleChartProps): Partial<Layout> {
        return {
            font: {
                family: "Open Sans, sans-serif",
                size: 12,
                color: "#888"
            },
            autosize: true,
            hovermode: "closest",
            showlegend: props.showLegend,
            xaxis: {
                gridcolor: "#eaeaea",
                title: props.xAxisLabel,
                showgrid: props.grid === "vertical" || props.grid === "both",
                rangeslider: { visible: props.showRangeSlider || false }
            },
            yaxis: {
                rangemode: "tozero",
                zeroline: true,
                zerolinecolor: "#eaeaea",
                gridcolor: "#eaeaea",
                title: props.yAxisLabel,
                showgrid: props.grid === "horizontal" || props.grid === "both"
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

    public static getConfigOptions(): Partial<Config> {
        return { displayModeBar: false, doubleClick: false };
    }

    public static getDefaultSeriesOptions(series: SeriesProps, props: BubbleChartProps): Partial<ScatterData> {
        return {
            connectgaps: true,
            mode: "markers",
            hoveron: "points",
            hoverinfo: series.tooltipForm ? "none" : "text" as any, // typings don't have a hoverinfo value of "none"
            name: series.name,
            type: "scatter"
        };
    }

}
