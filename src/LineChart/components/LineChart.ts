// tslint:disable no-console
import { Component, ReactElement, createElement } from "react";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { LineChartContainerProps } from "./LineChartContainer";
import { Playground } from "../../components/Playground";
import { PlotlyChart } from "../../components/PlotlyChart";

import { SeriesData, SeriesProps, getRuntimeTraces, getSeriesTraces } from "../../utils/data";
import deepMerge from "deepmerge";
import { Config, Layout, ScatterData, ScatterHoverData } from "plotly.js";
import { getDimensions, parseStyle } from "../../utils/style";
import { LineMode } from "../../utils/types";

import "../../ui/Charts.scss";

export interface LineChartProps extends LineChartContainerProps {
    data?: SeriesData[];
    defaultData?: ScatterData[];
    loading?: boolean;
    alertMessage?: string | ReactElement<any>;
    onClick?: (series: SeriesProps, dataObject: mendix.lib.MxObject) => void;
    onHover?: (node: HTMLDivElement, tooltipForm: string, dataObject: mendix.lib.MxObject) => void;
}

interface LineChartState {
    layoutOptions: string;
    data?: SeriesData[];
}

export class LineChart extends Component<LineChartProps, LineChartState> {
    private tooltipNode: HTMLDivElement;

    constructor(props: LineChartProps) {
        super(props);

        this.onClick = this.onClick.bind(this);
        this.onHover = this.onHover.bind(this);
        this.onRuntimeUpdate = this.onRuntimeUpdate.bind(this);
        this.getTooltipNodeRef = this.getTooltipNodeRef.bind(this);
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
        if (this.props.devMode === "advancedDev") {
            return createElement(Playground, {
                supportSeries: true,
                layoutOptions: this.state.layoutOptions || "{\n\n}",
                rawData: this.state.data || [],
                chartData: this.getData(this.props),
                modelerConfigs: JSON.stringify(LineChart.defaultLayoutConfigs(this.props), null, 4),
                traces: this.state.data ? this.state.data.map(getRuntimeTraces) : [],
                onChange: this.onRuntimeUpdate
            }, this.renderLineChart());
        }

        return this.renderLineChart();
    }

    componentWillReceiveProps(newProps: LineChartProps) {
        this.setState({
            layoutOptions: newProps.layoutOptions,
            data: newProps.data
        });
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

    private getTooltipNodeRef(node: HTMLDivElement) {
        this.tooltipNode = node;
    }

    private getLayoutOptions(props: LineChartProps): Partial<Layout> {
        const advancedOptions = this.state.layoutOptions ? JSON.parse(this.state.layoutOptions) : {};
        const layoutOptions = deepMerge.all([ LineChart.defaultLayoutConfigs(props), advancedOptions ]);

        console.log("Layout Options: ", layoutOptions);
        return layoutOptions;
    }

    private getData(props: LineChartProps): ScatterData[] {
        let lineData: ScatterData[] = props.defaultData || [];
        if (this.state.data) {
            lineData = this.state.data.map(({ data, series }) => {
                const rawOptions = series.seriesOptions ? JSON.parse(series.seriesOptions) : {};
                const configOptions: Partial<ScatterData> = {
                    connectgaps: true,
                    hoveron: "points",
                    hoverinfo: series.tooltipForm ? "text" : undefined,
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
                return { ...deepMerge.all<ScatterData>([ configOptions, rawOptions ]), customdata: data };
            });
        }

        const dataOptions = props.area === "stacked" ? LineChart.getStackedArea(lineData) : lineData;
        console.log("Data Options: ", dataOptions);

        return dataOptions;
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
            const positionYaxis = yaxis.l2p(y) + yaxis._offset;
            const positionXaxis = xaxis.d2p(x) + xaxis._offset;
            this.tooltipNode.style.top = `${positionYaxis}px`;
            this.tooltipNode.style.left = `${positionXaxis}px`;
            this.tooltipNode.style.opacity = "1";
            this.props.onHover(this.tooltipNode, data.series.tooltipForm, customdata);
        }
    }

    private onRuntimeUpdate(layoutOptions: string, data: SeriesData[]) {
        this.setState({ layoutOptions, data });
    }

    private static defaultLayoutConfigs(props: LineChartProps): Partial<Layout> {
        return {
            autosize: true,
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

    private static getStackedArea(traces: ScatterData[]) {
        for (let i = 1; i < traces.length; i++) {
            for (let j = 0; j < (Math.min(traces[i].y.length, traces[i - 1].y.length)); j++) {
                (traces[i].y[j] as any) += traces[i - 1].y[j];
            }
        }

        return traces;
    }
}
