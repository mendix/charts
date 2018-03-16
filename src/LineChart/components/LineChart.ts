import { Component, ReactChild, ReactElement, createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { HoverTooltip } from "../../components/HoverTooltip";
import { SeriesPlayground } from "../../components/SeriesPlayground";
import { PlotlyChart } from "../../components/PlotlyChart";

import { getRuntimeTraces, getSeriesTraces } from "../../utils/data";
import deepMerge from "deepmerge";
import { Container, Data } from "../../utils/namespaces";
import { Config, Layout, ScatterData, ScatterHoverData } from "plotly.js";
import { getDimensions, getTooltipCoordinates, parseStyle, setTooltipPosition } from "../../utils/style";

import SeriesData = Data.SeriesData;
import LineChartContainerProps = Container.LineChartContainerProps;
import SeriesProps = Data.SeriesProps;
import LineMode = Container.LineMode;
import LineSeriesProps = Data.LineSeriesProps;

import "../../ui/Charts.scss";

export interface LineChartProps extends LineChartContainerProps {
    scatterData?: ScatterData[];
    seriesOptions?: string[];
    loading?: boolean;
    alertMessage?: ReactChild;
    onClick?: (series: SeriesProps, dataObject: mendix.lib.MxObject, mxform: mxui.lib.form._FormBase) => void;
    onHover?: (node: HTMLDivElement, tooltipForm: string, dataObject: mendix.lib.MxObject) => void;
}

interface LineChartState {
    layoutOptions: string;
    series?: LineSeriesProps[];
    scatterData?: ScatterData[];
    seriesOptions?: string[];
    playgroundLoaded: boolean;
}

export class LineChart extends Component<LineChartProps, LineChartState> {
    state: LineChartState = {
        layoutOptions: this.props.layoutOptions,
        series: this.props.series,
        scatterData: this.props.scatterData,
        seriesOptions: this.props.seriesOptions,
        playgroundLoaded: false
    };
    private tooltipNode?: HTMLDivElement;
    private Playground?: typeof SeriesPlayground;

    constructor(props: LineChartProps) {
        super(props);

        if (props.devMode === "developer" && !this.state.playgroundLoaded) {
            this.loadPlaygroundComponent();
        }
    }
    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: "widget-charts-line-alert" }, this.props.alertMessage);
        }
        if (this.props.loading || (this.props.devMode === "developer" && !this.state.playgroundLoaded)) {
            return createElement(ChartLoading, { text: "Loading" });
        }
        if (this.props.devMode === "developer" && this.state.playgroundLoaded) {
            return this.renderPlayground();
        }

        return this.renderLineChart();
    }

    componentWillReceiveProps(newProps: LineChartProps) {
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

    private renderLineChart(): ReactElement<any> {
        return createElement(PlotlyChart,
            {
                type: "line",
                className: this.props.class,
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) },
                layout: this.getLayoutOptions(this.props),
                data: this.getData(this.props),
                config: LineChart.getConfigOptions(),
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
                    JSON.stringify(LineChart.getDefaultSeriesOptions(series as LineSeriesProps, this.props), null, 4)
                ),
                onChange: this.onRuntimeUpdate,
                layoutOptions: this.state.layoutOptions || "{\n\n}",
                modelerLayoutConfigs: JSON.stringify(LineChart.defaultLayoutConfigs(this.props), null, 4)
            }, this.renderLineChart());
        }

        return null;
    }

    private getTooltipNodeRef = (node: HTMLDivElement) => {
        this.tooltipNode = node;
    }

    private getLayoutOptions(props: LineChartProps): Partial<Layout> {
        const advancedOptions = props.devMode !== "basic" && this.state.layoutOptions
            ? JSON.parse(this.state.layoutOptions)
            : {};

        return deepMerge.all([ LineChart.defaultLayoutConfigs(props), advancedOptions ]);
    }

    private getData(props: LineChartProps): ScatterData[] {
        const { seriesOptions } = this.state;
        if (props.scatterData) {
            const lineData = props.scatterData.map((data, index) => {
                const parsedOptions = props.devMode !== "basic" && seriesOptions
                    ? JSON.parse(seriesOptions[index])
                    : {};

                // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
                return {
                    ...deepMerge.all<ScatterData>([ data, parsedOptions ]),
                    customdata: data.customdata
                };
            });

            return props.area === "stacked" ? LineChart.getStackedArea(lineData) : lineData;
        }

        return [];
    }

    private onClick = ({ points }: ScatterHoverData<mendix.lib.MxObject>) => {
        if (this.props.onClick) {
            this.props.onClick(points[0].data.series, points[0].customdata, this.props.mxform);
        }
    }

    private onHover = ({ event, points }: ScatterHoverData<mendix.lib.MxObject>) => {
        const { customdata, data, y, text } = points[0];
        if (event && this.tooltipNode) {
            unmountComponentAtNode(this.tooltipNode);
            const coordinates = getTooltipCoordinates(event, this.tooltipNode);
            if (coordinates) {
                setTooltipPosition(this.tooltipNode, coordinates);
                if (data.series.tooltipForm && this.props.onHover) {
                    this.tooltipNode.innerHTML = "";
                    this.props.onHover(this.tooltipNode, data.series.tooltipForm, customdata);
                } else {
                    render(createElement(HoverTooltip, { text: text || y }), this.tooltipNode);
                }
            }
        }
    }

    private onRuntimeUpdate = (layoutOptions: string, seriesOptions: string[]) => {
        this.setState({ layoutOptions, seriesOptions });
    }

    public static defaultLayoutConfigs(props: LineChartProps): Partial<Layout> {
        return {
            font: {
                family: "Open Sans",
                size: 14,
                color: "#555"
            },
            autosize: true,
            hovermode: "closest",
            showlegend: props.showLegend,
            xaxis: {
                gridcolor: "#d7d7d7",
                title: props.xAxisLabel,
                showgrid: props.grid === "vertical" || props.grid === "both",
                fixedrange: props.xAxisType !== "date",
                type: props.xAxisType,
                rangeslider: { visible: props.showRangeSlider || false }
            },
            yaxis: {
                rangemode: "tozero",
                zeroline: true,
                zerolinecolor: "#eaeaea",
                gridcolor: "#d7d7d7",
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

    public static getConfigOptions(): Partial<Config> {
        return { displayModeBar: false, doubleClick: false };
    }

    public static getDefaultSeriesOptions(series: LineSeriesProps, props: LineChartProps): Partial<ScatterData> {
        return {
            connectgaps: true,
            hoveron: "points",
            hoverinfo: "none" as any,
            line: {
                color: series.lineColor,
                shape: series.lineStyle
            },
            mode: series.mode ? series.mode.replace("X", "+") as LineMode : "lines",
            name: series.name,
            type: "scatter",
            fill: props.fill || series.fill ? "tonexty" : "none"
        };
    }

    public static getStackedArea(traces: ScatterData[]) {
        for (let i = 1; i < traces.length; i++) {
            for (let j = 0; j < (Math.min(traces[i].y.length, traces[i - 1].y.length)); j++) {
                (traces[i].y[j] as any) += traces[i - 1].y[j];
            }
        }

        return traces;
    }
}
