import { Component, ReactChild, ReactElement, createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { HoverTooltip } from "../../components/HoverTooltip";
import { SeriesPlayground } from "../../components/SeriesPlayground";
import { PlotlyChart } from "../../components/PlotlyChart";

import { configs } from "../../utils/configs";
import { getRuntimeTraces, getSeriesTraces } from "../../utils/data";
import deepMerge from "deepmerge";
import { Container, Data } from "../../utils/namespaces";
import { Config, Layout, ScatterData, ScatterHoverData } from "plotly.js";
import { getDimensions, getTooltipCoordinates, parseStyle, setTooltipPosition } from "../../utils/style";

import "../../ui/Charts.scss";

export interface BarChartProps extends Container.BarChartContainerProps {
    alertMessage?: ReactChild;
    loading?: boolean;
    scatterData?: ScatterData[];
    seriesOptions?: string[];
    onClick?: (series: Data.SeriesProps, dataObject: mendix.lib.MxObject, mxform: mxui.lib.form._FormBase) => void;
    onHover?: (node: HTMLDivElement, tooltipForm: string, dataObject: mendix.lib.MxObject) => void;
}

interface BarChartState {
    layoutOptions: string;
    series?: Data.SeriesProps[];
    seriesOptions?: string[];
    scatterData?: ScatterData[];
    playgroundLoaded: boolean;
    configurationOptions: string;
}

export class BarChart extends Component<BarChartProps, BarChartState> {
    state: BarChartState = {
        layoutOptions: this.props.layoutOptions,
        series: this.props.series,
        configurationOptions: this.props.configurationOptions,
        seriesOptions: this.props.seriesOptions,
        scatterData: this.props.scatterData,
        playgroundLoaded: false
    };
    private tooltipNode?: HTMLDivElement;
    private Playground?: typeof SeriesPlayground;

    constructor(props: BarChartProps) {
        super(props);

        if (props.devMode === "developer") {
            this.loadPlaygroundComponent();
        }
    }

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: "widget-charts-bar-alert" }, this.props.alertMessage);
        }
        if (this.props.loading || (this.props.devMode === "developer" && !this.state.playgroundLoaded)) {
            return createElement(ChartLoading);
        }
        if (this.props.devMode === "developer" && this.state.playgroundLoaded) {
            return this.renderPlayground();
        }

        return this.renderChart();
    }

    componentWillReceiveProps(newProps: BarChartProps) {
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

    private getTooltipNodeRef = (node: HTMLDivElement) => {
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
                config: this.getConfigOptions(this.props),
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
                seriesOptions: this.state.seriesOptions || [],
                modelerSeriesConfigs: this.state.series && this.state.series.map(series =>
                    JSON.stringify(BarChart.getDefaultSeriesOptions(series, this.props), null, 2)
                ),
                onChange: this.onRuntimeUpdate,
                layoutOptions: this.state.layoutOptions || "{\n\n}",
                configurationOptions: this.state.configurationOptions || "{\n\n}",
                configurationOptionsDefault: JSON.stringify(BarChart.getDefaultConfigOptions(), null, 2),
                modelerLayoutConfigs: JSON.stringify(BarChart.defaultLayoutConfigs(this.props), null, 2)
            }, this.renderChart());
        }

        return null;
    }

    private getLayoutOptions(props: BarChartProps): Partial<Layout> {
        const advancedOptions = props.devMode !== "basic" && this.state.layoutOptions
            ? JSON.parse(this.state.layoutOptions)
            : {};

        return deepMerge.all([ BarChart.defaultLayoutConfigs(props), advancedOptions ]);
    }

    private getData(props: BarChartProps): ScatterData[] {
        if (props.scatterData && this.state.seriesOptions && props.devMode !== "basic") {
            return props.scatterData.map((data, index) => {
                const parsedOptions = props.devMode !== "basic" && this.state.seriesOptions
                    ? JSON.parse(this.state.seriesOptions[index])
                    : {};

                // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
                return {
                    ...deepMerge.all<ScatterData>([ data, parsedOptions ]),
                    customdata: data.customdata
                };
            });
        }

        return props.scatterData || [];
    }

    private onClick = (data: ScatterHoverData<mendix.lib.MxObject>) => {
        const pointClicked = data.points[0];
        if (this.props.onClick) {
            this.props.onClick(pointClicked.data.series, pointClicked.customdata, this.props.mxform);
        }
    }

    private onHover = ({ event, points }: ScatterHoverData<mendix.lib.MxObject>) => {
        const { customdata, data, x, y, text } = points[0];
        if (event && this.tooltipNode) {
            unmountComponentAtNode(this.tooltipNode);
            const coordinates = getTooltipCoordinates(event, this.tooltipNode);
            if (coordinates) {
                setTooltipPosition(this.tooltipNode, coordinates);
                if (data.series.tooltipForm && this.props.onHover) {
                    this.props.onHover(this.tooltipNode, data.series.tooltipForm, customdata);
                } else if (points[0].data.hoverinfo === "none" as any) {
                    render(createElement(HoverTooltip, {
                        text: this.props.orientation === "bar" ? x : y
                    }), this.tooltipNode);
                } else {
                    this.tooltipNode.style.opacity = "0";
                }
            }
        }
    }

    private onRuntimeUpdate = (layoutOptions: string, seriesOptions: string[], configurationOptions: string) => {
        this.setState({ layoutOptions, seriesOptions, configurationOptions });
    }

    private static getDefaultConfigOptions(): Partial<Config> {
        return { displayModeBar: false, doubleClick: false };
    }

    public getConfigOptions(props: BarChartProps): Partial<Config> {
        const parsedConfig = props.devMode !== "basic" && this.state.configurationOptions
            ? JSON.parse(this.state.configurationOptions)
            : {};
        return deepMerge.all([ BarChart.getDefaultConfigOptions(), parsedConfig ]);
    }

    public static getDefaultSeriesOptions(series: Data.SeriesProps, props: BarChartProps): Partial<ScatterData> {
        const hoverinfo = (props.orientation === "bar" ? "x" : "y") as any;

        return {
            name: series.name,
            type: "bar",
            hoverinfo: "none" as any, // typings don't have a hoverinfo value of "y"
            orientation: props.orientation === "bar" ? "h" : "v"
        };
    }

    public static defaultLayoutConfigs(props: BarChartProps): Partial<Layout> {
        const defaultConfigs: Partial<Layout> = {
            barmode: props.barMode,
            showlegend: props.showLegend,
            xaxis: {
                gridcolor: "#d7d7d7",
                zerolinecolor: "#d7d7d7",
                zeroline: props.orientation === "bar" ? true : false,
                title: props.xAxisLabel,
                showgrid: props.grid === "vertical" || props.grid === "both",
                fixedrange: true
            },
            yaxis: {
                rangemode: "tozero",
                zeroline: true,
                zerolinecolor: "#d7d7d7",
                gridcolor: "#d7d7d7",
                title: props.yAxisLabel,
                showgrid: props.grid === "horizontal" || props.grid === "both",
                fixedrange: true
            }
        };

        return deepMerge.all([ configs.layout, defaultConfigs ]);
    }
}
