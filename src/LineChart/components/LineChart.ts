// tslint:disable no-console
import { Component, ReactElement, createElement } from "react";
import * as classNames from "classnames";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { LineChartContainerProps } from "./LineChartContainer";
import { RuntimeEditor } from "../../components/RuntimeEditor";

import { SeriesData, SeriesProps, getRuntimeTraces, getSeriesTraces } from "../../utils/data";
import deepMerge from "deepmerge";
import * as elementResize from "element-resize-detector";
import { Config, Layout, ScatterData, ScatterHoverData } from "plotly.js";
import { newPlot, purge } from "../../PlotlyCustom";
import { getDimensions, parseStyle } from "../../utils/style";
import { LineMode } from "../../utils/types";

import "../../ui/Charts.scss";

export interface LineChartProps extends LineChartContainerProps {
    data?: SeriesData[];
    defaultData?: ScatterData[];
    loading?: boolean;
    alertMessage?: string | ReactElement<any>;
    onClick?: (series: SeriesProps, dataObject: mendix.lib.MxObject) => void;
    onHover?: (node: HTMLDivElement, dataObject: mendix.lib.MxObject) => void;
}

interface LineChartState {
    layoutOptions: string;
    data?: SeriesData[];
}

export class LineChart extends Component<LineChartProps, LineChartState> {
    private lineChartNode?: HTMLDivElement;
    private tooltipNode: HTMLDivElement;
    private timeoutId: number;
    private resizeDetector = elementResize({ strategy: "scroll" });

    constructor(props: LineChartProps) {
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
            data: props.data
        };
    }

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, {
                className: "widget-charts-line-alert",
                message: this.props.alertMessage
            });
        }
        if (this.props.loading) {
            return createElement(ChartLoading, { text: "Loading" });
        }
        if (this.props.devMode) {
            return createElement(RuntimeEditor, {
                supportSeries: true,
                layoutOptions: this.state.layoutOptions || "{\n\n}",
                rawData: this.state.data || [],
                chartData: this.getData(this.props),
                modelerConfigs: JSON.stringify(LineChart.defaultLayoutConfigs(this.props), null, 4),
                traces: this.state.data ? this.state.data.map(getRuntimeTraces) : [],
                onChange: this.onRuntimeUpdate
            }, this.renderLineChartNode());
        }

        return this.renderLineChartNode();
    }

    componentDidMount() {
        if (!this.props.loading) {
            this.renderChart(this.props);
            this.addResizeListener();
        }
    }

    componentWillReceiveProps(newProps: LineChartProps) {
        this.setState({
            layoutOptions: newProps.layoutOptions,
            data: newProps.data
        });
    }

    componentDidUpdate() {
        if (!this.props.loading) {
            this.renderChart(this.props);
            this.addResizeListener();
        }
    }

    componentWillUnmount() {
        if (this.lineChartNode) {
            purge(this.lineChartNode);
        }
    }

    private renderLineChartNode(): ReactElement<any> {
        return createElement("div",
            {
                className: classNames("widget-charts-line", this.props.class),
                ref: this.getPlotlyNodeRef,
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) }
            },
            createElement("div", { className: "widget-charts-tooltip", ref: this.getTooltipNodeRef })
        );
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.lineChartNode = node;
    }

    private getTooltipNodeRef(node: HTMLDivElement) {
        this.tooltipNode = node;
    }

    private addResizeListener() {
        if (this.lineChartNode && this.lineChartNode.parentElement) {
            this.resizeDetector.removeListener(this.lineChartNode.parentElement, this.onResize);
            this.resizeDetector.listenTo(this.lineChartNode.parentElement, this.onResize);
        }
    }

    private renderChart(props: LineChartProps) {
        if (this.lineChartNode) {
            const data = this.getData(props);
            const scatterData = props.area === "stacked" ? LineChart.getStackedArea(data) : data;
            newPlot(this.lineChartNode, scatterData, this.getLayoutOptions(props), LineChart.getConfigOptions(props))
                .then(myPlot => {
                    myPlot.on("plotly_click", this.onClick);
                    myPlot.on("plotly_hover", this.onHover);
                    myPlot.on("plotly_unhover", this.clearToolTip);
                });
        }
    }

    private getLayoutOptions(props: LineChartProps): Partial<Layout> {
        const advancedOptions = this.state.layoutOptions ? JSON.parse(this.state.layoutOptions) : {};

        const layoutOptions = deepMerge.all([ {
            ...LineChart.defaultLayoutConfigs(props),
            width: this.lineChartNode && this.lineChartNode.clientWidth,
            height: this.lineChartNode && this.lineChartNode.clientHeight
        }, advancedOptions ]);

        console.log("Layout Options: ", layoutOptions);
        return layoutOptions;
    }

    private getData(props: LineChartProps): ScatterData[] {
        if (this.state.data) {
            const dataOptions = this.state.data.map(({ data, series }) => {
                const rawOptions = series.seriesOptions ? JSON.parse(series.seriesOptions) : {};
                const configOptions = {
                    connectgaps: true,
                    hoveron: "points",
                    hoverinfo: props.tooltipForm ? "text" : undefined,
                    line: {
                        color: series.lineColor,
                        shape: series.lineStyle
                    },
                    mode: series.mode ? series.mode.replace("X", "+") as LineMode : "lines",
                    name: series.name,
                    type: "scatter",
                    fill: props.fill ? "tonexty" : "none",
                    series,
                    ... getSeriesTraces({ data, series })
                };

                // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
                return { ...deepMerge.all<ScatterData>([ configOptions, rawOptions ]), mxObjects: data };
            });

            console.log("Data Options: ", dataOptions);
            return dataOptions;
        }

        console.log("Default Data: ", props.defaultData);
        return props.defaultData || [];
    }

    private onClick(data: ScatterHoverData) {
        const pointClicked = data.points[0];
        if (this.props.onClick) {
            this.props.onClick(pointClicked.data.series, pointClicked.data.mxObjects[pointClicked.pointNumber]);
        }
    }

    private onHover(data: ScatterHoverData) {
        if (this.props.onHover) {
            const activePoint = data.points[0];
            const positionYaxis = activePoint.yaxis.l2p(activePoint.y) + activePoint.yaxis._offset;
            const positionXaxis = activePoint.xaxis.d2p(activePoint.x) + activePoint.xaxis._offset;
            this.tooltipNode.style.top = `${positionYaxis}px`;
            this.tooltipNode.style.left = `${positionXaxis}px`;
            this.tooltipNode.style.opacity = "1";
            this.props.onHover(this.tooltipNode, activePoint.data.mxObjects[activePoint.pointNumber]);
        }
    }

    private clearToolTip() {
        this.tooltipNode.innerHTML = "";
        this.tooltipNode.style.opacity = "0";
    }

    private onRuntimeUpdate(layoutOptions: string, data: SeriesData[]) {
        this.setState({ layoutOptions, data });
    }

    private onResize() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => {
            if (this.lineChartNode) {
                purge(this.lineChartNode);
                this.renderChart(this.props);
            }
            this.timeoutId = 0;
        }, 100);
    }

    private static defaultLayoutConfigs(props: LineChartProps): Partial<Layout> {
        return {
            autosize: true,
            hovermode: "closest",
            showlegend: props.showLegend,
            xaxis: {
                title: props.xAxisLabel,
                showgrid: props.grid === "vertical" || props.grid === "both",
                fixedrange: !props.enableZoom
            },
            yaxis: {
                title: props.yAxisLabel,
                showgrid: props.grid === "horizontal" || props.grid === "both",
                fixedrange: !props.enableZoom
            }
        };
    }

    private static getConfigOptions(props: LineChartProps): Partial<Config> {
        return { displayModeBar: props.showToolbar, doubleClick: false };
    }

    private static getStackedArea(traces: ScatterData[]) {
        for (let i = 1; i < traces.length; i++) {
            for (let j = 0; j < (Math.min(traces[i].y.length, traces[i - 1].y.length)); j++) {
                (traces[i].y[j] as any) += traces[i - 1].y[j];
            }
        }

        return traces;
    }
}
