import { Component, ReactChild, ReactElement, createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { HoverTooltip } from "../../components/HoverTooltip";
import { SeriesPlayground } from "../../components/SeriesPlayground";
import { PlotlyChart } from "../../components/PlotlyChart";

import { ChartConfigs, configs, fetchThemeConfigs } from "../../utils/configs";
import { getRuntimeTraces, getSeriesTraces } from "../../utils/data";
import deepMerge from "deepmerge";
import { Container, Data } from "../../utils/namespaces";
import { Config, Layout, ScatterData, ScatterHoverData } from "plotly.js";
import { getDimensions, getDimensionsFromNode, getTooltipCoordinates, parseStyle, setTooltipPosition } from "../../utils/style";

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
    themeConfigs: { layout: {}, configuration: {}, data: {} };
    onClick?: (series: SeriesProps, dataObject: mendix.lib.MxObject, mxform: mxui.lib.form._FormBase) => void;
    onHover?: (node: HTMLDivElement, tooltipForm: string, dataObject: mendix.lib.MxObject) => void;
}

interface LineChartState {
    layoutOptions: string;
    series: LineSeriesProps[];
    scatterData?: ScatterData[];
    seriesOptions?: string[];
    configurationOptions: string;
    playgroundLoaded: boolean;
    hiddenTraces: number[];
}

interface Dimensions {
    width: number;
    height: number;
}

export class LineChart extends Component<LineChartProps, LineChartState> {
    static defaultProps: Partial<LineChartProps> = {
        type: "line"
    };
    state: LineChartState = {
        layoutOptions: this.props.layoutOptions,
        configurationOptions: this.props.configurationOptions,
        series: this.props.series,
        scatterData: this.props.scatterData,
        seriesOptions: this.props.seriesOptions,
        playgroundLoaded: false,
        hiddenTraces: []
    };
    private tooltipNode?: HTMLDivElement;
    private chartNode?: HTMLDivElement;
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
            return createElement(ChartLoading);
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
                type: LineChart.getChartType(this.props.type),
                className: this.props.class,
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) },
                layout: this.getLayoutOptions(this.props),
                data: this.getData(this.props),
                config: this.getConfigOptions(this.props),
                onClick: this.onClick,
                onHover: this.onHover,
                onRestyle: this.onRestyle,
                getTooltipNode: this.getTooltipNodeRef,
                onRender: this.onLoadAndResize,
                onResize: this.onLoadAndResize
            }
        );
    }

    private renderPlayground(): ReactElement<any> | null {
        if (this.Playground) {
            const modelerLayoutConfigs = deepMerge.all(
                [ LineChart.defaultLayoutConfigs(this.props), this.props.themeConfigs.layout ]
            );
            const modelerSeriesConfigs = this.state.series ? this.state.series.map(_series => deepMerge.all([
                LineChart.getDefaultSeriesOptions(_series, this.props),
                this.props.themeConfigs.data
            ])) : [];

            return createElement(this.Playground, {
                series: this.props.series,
                seriesOptions: this.state.seriesOptions || [],
                modelerSeriesConfigs: modelerSeriesConfigs.map(config => JSON.stringify(config, null, 2)),
                onChange: this.onRuntimeUpdate,
                layoutOptions: this.state.layoutOptions || "{\n\n}",
                configurationOptions: this.state.configurationOptions || "{\n\n}",
                configurationOptionsDefault: JSON.stringify(LineChart.getDefaultConfigOptions(this.props), null, 2),
                modelerLayoutConfigs: JSON.stringify(modelerLayoutConfigs, null, 2)
            }, this.renderLineChart());
        }

        return null;
    }

    private getTooltipNodeRef = (node: HTMLDivElement) => {
        this.tooltipNode = node;
    }

    private getLayoutOptions(props: LineChartProps): Partial<Layout> {
        const { layoutOptions } = this.state;
        const advancedOptions = props.devMode !== "basic" && layoutOptions ? JSON.parse(layoutOptions) : {};
        const themeLayoutConfigs = props.devMode !== "basic" ? this.props.themeConfigs.layout : {};

        return deepMerge.all([ LineChart.defaultLayoutConfigs(props), themeLayoutConfigs, advancedOptions ]);
    }

    private getData(props: LineChartProps): ScatterData[] {
        if (this.state.scatterData && this.chartNode) {
            const { seriesOptions: options } = this.state;
            const dataThemeConfigs = props.devMode !== "basic" ? props.themeConfigs.data : {};
            const dimensions = getDimensionsFromNode(this.chartNode);
            const lineData: ScatterData[] = this.state.scatterData.map((data, index) => {
                const parsedOptions = props.devMode !== "basic" && options ? JSON.parse(options[index]) : {};
                const scatterData = deepMerge.all<ScatterData>(
                    [ data, dataThemeConfigs, parsedOptions, { visible: data.visible || true } ]
                );
                const series = this.state.series[index];
                if (props.type === "bubble") {
                    const sizeref = LineChart.getMarkerSizeReference(props, series, data.marker.size as number[], dimensions);

                    return {
                        ...deepMerge.all<ScatterData>([ scatterData, {
                            marker: { sizemode: "diameter", sizeref }
                        } ]),
                        customdata: data.customdata
                    };
                }

                // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
                return { ...scatterData, customdata: data.customdata };
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
        const { customdata, data, r, y, text } = points[0];
        if (event && this.tooltipNode && this.tooltipNode.style.opacity !== "1") {
            unmountComponentAtNode(this.tooltipNode);
            const coordinates = getTooltipCoordinates(event, this.tooltipNode);
            if (coordinates) {
                setTooltipPosition(this.tooltipNode, coordinates);
                if (data.series.tooltipForm && this.props.onHover) {
                    this.props.onHover(this.tooltipNode, data.series.tooltipForm, customdata);
                } else if (points[0].data.hoverinfo === "none" as any) {
                    render(createElement(HoverTooltip, { text: text || y || r }), this.tooltipNode);
                } else {
                    this.tooltipNode.style.opacity = "0";
                }
            }
        }
    }

    private onRestyle = (data: any[]) => {
        if (this.state.scatterData) {
            (this.state.scatterData as any)[data[1][0]].visible = data[0].visible[0];
            this.setState({ scatterData: this.state.scatterData });
        }
    }

    private onRuntimeUpdate = (layoutOptions: string, seriesOptions: string[]) => {
        const updatedScatterData = seriesOptions.map((option, index) => {
            const rawOptions = option ? JSON.parse(option) : {};
            if (rawOptions.visible) {
                const { scatterData } = this.state;
                (scatterData as any)[index].visible = rawOptions.visible;

                return (scatterData as any)[index];
            }

            return (this.state.scatterData as any)[index];
        });
        this.setState({ layoutOptions, seriesOptions, scatterData: updatedScatterData });
    }

    private onLoadAndResize = (node: HTMLDivElement) => {
        this.chartNode = node;
        this.forceUpdate();
    }

    public static getChartType(type: string): "line" | "polar" {
        return type !== "polar" ? "line" : "polar";
    }

    public static defaultLayoutConfigs(props: LineChartProps): Partial<Layout> {
        const derivedSharedConfigs: Partial<Layout> = {
            showlegend: props.showLegend,
            margin: {
                t: props.type === "polar" ? 60 : 10
            }
        };

        const sharedConfigs: Partial<Layout> = deepMerge.all([ derivedSharedConfigs, configs.layout ]);

        if (props.type !== "polar") {
            const lineConfigs: Partial<Layout> = {
                xaxis: {
                    fixedrange: props.xAxisType !== "date",
                    gridcolor: "#d7d7d7",
                    rangeslider: {
                        visible: props.showRangeSlider || false
                    },
                    showgrid: props.grid === "vertical" || props.grid === "both",
                    title: props.xAxisLabel,
                    type: props.xAxisType,
                    zeroline: true,
                    zerolinecolor: "#d7d7d7"
                },
                yaxis: {
                    rangemode: props.rangeMode || "tozero",
                    zeroline: true,
                    zerolinecolor: "#d7d7d7",
                    gridcolor: "#d7d7d7",
                    title: props.yAxisLabel,
                    showgrid: props.grid === "horizontal" || props.grid === "both",
                    fixedrange: true
                }
            };

            return { ...sharedConfigs, ...lineConfigs };
        } else if (props.type === "polar" && props.polar) {
            return { ...sharedConfigs, polar: props.polar } as Partial<Layout>;
        }

        return sharedConfigs;
    }

    public static getDefaultConfigOptions(props: LineChartProps): Partial<Config> {
        return { displayModeBar: false, doubleClick: props.xAxisType === "date" ? "reset" : false };
    }

    public getConfigOptions(props: LineChartProps): Partial<Config> {
        const parsedConfig = props.devMode !== "basic" && this.state.configurationOptions
            ? JSON.parse(this.state.configurationOptions)
            : {};

        return deepMerge.all([ LineChart.getDefaultConfigOptions(props), props.themeConfigs.configuration, parsedConfig ]);
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
            type: LineChart.getChartType(props.type) === "line" ? "scatter" : "scatterpolar" as any,
            fill: props.fill || series.fill
                ? props.type === "polar" ? "toself" : "tonexty"
                : "none",
            marker: props.type === "bubble" ? { line: { width: 0 } } : {}
        };
    }

    public static getStackedArea(traces: ScatterData[]) {
        const visibleTraces = traces.filter((data, index) => data.visible === true);
        for (let i = 1; i < visibleTraces.length; i++) {
            for (let j = 0; j < (Math.min(visibleTraces[i].y.length, visibleTraces[i - 1].y.length)); j++) {
                (visibleTraces[i].y[j] as any) += visibleTraces[i - 1].y[j];
            }
        }

        return traces;
    }

    public static getMarkerSizeReference(props: LineChartProps, series: LineSeriesProps, markerSize: number[], dimensions?: Dimensions): number {
        if (series.autoBubbleSize) {
            const width = dimensions ? dimensions.width : 0;
            const height = dimensions ? dimensions.height : 0;
            let sizeRef = 1;
            const averageSize = (width + height) / 2;
            const percentageSize = averageSize / (1 / (series.markerSizeReference / 100));

            if (markerSize.length > 0) {
                sizeRef = Math.max(...markerSize) / percentageSize;
            }

            return Math.round(sizeRef * 1000) / 1000;
        } else if (series.markerSizeReference > 0) {
            const scale = series.markerSizeReference;
            const percentageScale = scale / 100;

            return 1 / percentageScale;
        }

        return 1;
    }
}
