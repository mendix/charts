// tslint:disable no-console
import { Component, ReactElement, createElement } from "react";

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
    alertMessage?: string | ReactElement<any>;
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
            return createElement(Alert, {
                className: "widget-charts-bar-alert",
                message: this.props.alertMessage
            });
        }
        if (this.props.loading) {
            return createElement(ChartLoading, { text: "Loading" });
        }
        if (this.props.devMode === "advancedDev") {
            return createElement(Playground, {
                supportSeries: true,
                layoutOptions: this.state.layoutOptions || "{\n\n}",
                rawData: this.state.data || [],
                chartData: this.getData(this.props),
                modelerLayoutConfigs: JSON.stringify(BarChart.defaultLayoutConfigs(this.props), null, 4),
                modelerSeriesConfigs: this.state.data && this.state.data.map(({ series }) =>
                    JSON.stringify(BarChart.getDefaultSeriesOptions(series, this.props), null, 4)
                ),
                traces: this.state.data ? this.state.data.map(getRuntimeTraces) : [],
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

    componentWillReceiveProps(newProps: BarChartProps) {
        this.setState({
            layoutOptions: newProps.layoutOptions,
            data: newProps.data
        });
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

    private getLayoutOptions(props: BarChartProps): Partial<Layout> {
        const advancedOptions = this.state.layoutOptions ? JSON.parse(this.state.layoutOptions) : {};
        const layoutOptions = deepMerge.all([ BarChart.defaultLayoutConfigs(props), advancedOptions ]);

        console.log("Layout Options:", layoutOptions);
        return layoutOptions;
    }

    private getData(props: BarChartProps): ScatterData[] {
        let barData: ScatterData[] = props.defaultData || [];
        if (props.data) {
            barData = props.data.map(({ data, series }) => {
                const rawOptions = series.seriesOptions ? JSON.parse(series.seriesOptions) : {};
                const traces = getSeriesTraces({ data, series });
                const configOptions: Partial<ScatterData> = {
                    x: props.orientation === "bar" ? traces.y : traces.x,
                    y: props.orientation === "bar" ? traces.x : traces.y,
                    series,
                    ... BarChart.getDefaultSeriesOptions(series, props)
                };

                // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
                return { ...deepMerge.all<ScatterData>([ configOptions, rawOptions ]), customdata: data };
            });
        }

        console.log("Data Options:", barData);
        return barData;
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
            console.log("Custom Data", customdata);
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

    private static defaultLayoutConfigs(props: BarChartProps): Partial<Layout> {
        return {
            autosize: true,
            barmode: props.barMode,
            hovermode: "closest",
            showlegend: props.showLegend,
            xaxis: {
                title: props.xAxisLabel,
                showgrid: props.grid === "vertical" || props.grid === "both",
                fixedrange: true
            },
            yaxis: {
                title: props.yAxisLabel,
                showgrid: props.grid === "horizontal" || props.grid === "both",
                fixedrange: true
            },
            margin: {
                l: 60,
                r: 60,
                b: 60,
                t: 100,
                pad: 4
            }
        };
    }

    private static getConfigOptions(): Partial<Config> {
        return { displayModeBar: false, doubleClick: false };
    }

    private static getDefaultSeriesOptions(series: SeriesProps, props: BarChartProps): Partial<ScatterData> {
        return {
            name: series.name,
            type: "bar",
            hoverinfo: series.tooltipForm ? "text" : undefined,
            orientation: props.orientation === "bar" ? "h" : "v"
        };
    }
}
