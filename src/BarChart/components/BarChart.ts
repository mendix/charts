import { Config, Layout, ScatterData, ScatterHoverData } from "plotly.js";
import "../../ui/Charts.scss";
import { Component, ReactChild, ReactElement, createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { HoverTooltip } from "../../components/HoverTooltip";
import { PlotlyChart } from "../../components/PlotlyChart";
import deepMerge from "deepmerge";
import { parseAdvancedOptions } from "../../utils/data";
import { Data } from "../../utils/namespaces";
import { getDimensions, getTooltipCoordinates, parseStyle, setTooltipPosition } from "../../utils/style";
import { BarChartState } from "../store/BarChartReducer";
import { store } from "../store/store";
import { getCustomLayoutOptions, getCustomSeriesOptions, getDefaultConfigOptions, getDefaultLayoutOptions, getDefaultSeriesOptions } from "../utils/configs";
import { BarChartDataHandlerProps } from "./BarChartDataHandler";

export interface BarChartProps extends BarChartDataHandlerProps {
    alertMessage?: ReactChild;
    loading?: boolean;
    onClick?: (options: Data.OnClickOptions<{ x: string, y: number }, Data.SeriesProps>) => void;
    onHover?: (options: Data.OnHoverOptions<{ x: string, y: number }, Data.SeriesProps>) => void;
}

export class BarChart extends Component<BarChartProps & BarChartState> {
    private tooltipNode?: HTMLDivElement;

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: "widget-charts-bar-alert" }, this.props.alertMessage);
        }
        if (this.props.loading || (this.props.devMode === "developer" && !this.props.playground)) {
            return createElement(ChartLoading);
        }
        if (this.props.devMode === "developer" && this.props.playground) {
            return this.renderPlayground();
        }

        return this.renderChart();
    }

    componentDidMount() {
        if (this.props.devMode === "developer" && this.props.loadPlayground) {
            store.dispatch(this.props.loadPlayground());
        }
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
                data: this.props.scatterData || [],
                config: this.getConfigOptions(this.props),
                onClick: this.onClick,
                onHover: this.onHover,
                getTooltipNode: this.getTooltipNodeRef
            }
        );
    }

    private renderPlayground(): ReactElement<any> | null {
        if (this.props.playground) {
            const { series } = this.props;
            return createElement(this.props.playground, {
                series,
                seriesOptions: this.props.seriesOptions || [],
                modelerSeriesConfigs: this.getModelerSeriesOptions(this.props),
                onChange: this.onOptionsUpdate,
                layoutOptions: this.props.layoutOptions || "{\n\n}",
                configurationOptions: this.props.configurationOptions || "{\n\n}",
                configurationOptionsDefault: JSON.stringify(getDefaultConfigOptions(), null, 2),
                modelerLayoutConfigs: JSON.stringify(this.getModelerLayoutOptions(this.props), null, 2)
            }, this.renderChart());
        }

        return null;
    }

    private getLayoutOptions(props: BarChartProps): Partial<Layout> {
        const advancedOptions = parseAdvancedOptions(props.devMode, props.layoutOptions);

        return deepMerge.all([ this.getModelerLayoutOptions(props), advancedOptions ]);
    }

    private getModelerLayoutOptions(props: BarChartProps): Partial<Layout> {
        const themeLayoutOptions = props.devMode !== "basic" ? props.themeConfigs.layout : {};

        return deepMerge.all([
            getDefaultLayoutOptions(),
            getCustomLayoutOptions(props),
            themeLayoutOptions
        ]);
    }

    public getConfigOptions(props: BarChartProps): Partial<Config> {
        const advancedOptions = parseAdvancedOptions(props.devMode, this.props.configurationOptions);

        return deepMerge.all([ getDefaultConfigOptions(), props.themeConfigs.configuration, advancedOptions ]);
    }

    private getModelerSeriesOptions(props: BarChartProps): string[] {
        const themeSeriesOptions = props.devMode !== "basic" ? props.themeConfigs.data : {};
        return props.series ? props.series.map((series, index) => {
            const customOptions = getCustomSeriesOptions(series, props.orientation, index);
            const seriesOptions = deepMerge.all([ getDefaultSeriesOptions(), customOptions, themeSeriesOptions ]);

            return JSON.stringify(seriesOptions, null, 2);
        }) : [];
    }

    private onClick = ({ points }: ScatterHoverData<mendix.lib.MxObject>) => {
        const { customdata, data, x, y } = points[0];
        if (this.props.onClick) {
            this.props.onClick({
                mxObject: customdata,
                options: data.series,
                mxForm: this.props.mxform,
                trace: {
                    x: this.props.orientation === "bar" ? y as string : x as string,
                    y: this.props.orientation === "bar" ? x as number : y as number
                }
            });
        }
    }

    private onHover = ({ event, points }: ScatterHoverData<mendix.lib.MxObject>) => {
        const { customdata, data, x, y } = points[0];
        if (event && this.tooltipNode && this.tooltipNode.style.opacity !== "1") {
            unmountComponentAtNode(this.tooltipNode);
            const coordinates = getTooltipCoordinates(event, this.tooltipNode);
            if (coordinates) {
                setTooltipPosition(this.tooltipNode, coordinates);
                if (data.series.tooltipForm && this.props.onHover) {
                    this.tooltipNode.innerHTML = "";
                    this.props.onHover({
                        tooltipForm: data.series.tooltipForm,
                        tooltipNode: this.tooltipNode,
                        mxObject: customdata,
                        options: data.series,
                        trace: {
                            x: this.props.orientation === "bar" ? y as string : x as string,
                            y: this.props.orientation === "bar" ? x as number : y as number
                        }
                    });
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

    private onOptionsUpdate = (layoutOptions: string, seriesOptions: string[], configurationOptions: string) => {
        if (this.props.scatterData) {
            this.props.updateDataFromPlayground(this.props.scatterData, layoutOptions, seriesOptions, configurationOptions);
        }
    }

    public static getDefaultSeriesOptions(series: Data.SeriesProps, props: BarChartProps): Partial<ScatterData> {
        return {
            name: series.name,
            type: "bar",
            hoverinfo: "none" as any, // typings don't have a hoverinfo value of "y"
            orientation: props.orientation === "bar" ? "h" : "v"
        };
    }
}
