import deepMerge from "deepmerge";
import { Config, Layout, ScatterHoverData } from "plotly.js";
import { Component, ReactChild, ReactElement, createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { bindActionCreators } from "redux";
import { MapDispatchToProps, connect } from "react-redux";

import "../../ui/Charts.scss";
import { calculateBubbleSize, getStackedArea } from "../utils/data";
import { parseAdvancedOptions } from "../../utils/data";
import {
    getChartType,
    getCustomLayoutOptions,
    getCustomSeriesOptions,
    getDefaultLayoutOptions,
    getDefaultSeriesOptions } from "../utils/configs";
import { getDefaultConfigOptions } from "../../BarChart/utils/configs";
import { LineChartState } from "../store/LineChartReducer";
import { Data } from "../../utils/namespaces";
import { store } from "../../store";
import {
    getDimensions,
    getDimensionsFromNode,
    getTooltipCoordinates,
    parseStyle,
    setTooltipPosition } from "../../utils/style";

import { Alert } from "../../components/Alert";
import { HoverTooltip } from "../../components/HoverTooltip";
import { LineChartDataHandlerProps } from "./LineChartDataHandler";
import PlotlyChart from "../../components/PlotlyChart";
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";

interface ComponentProps extends LineChartDataHandlerProps {
    alertMessage?: ReactChild;
    onClick?: (options: Data.OnClickOptions<{ x: string, y: number }, Data.SeriesProps>) => void;
    onHover?: (options: Data.OnHoverOptions<{ x: string, y: number }, Data.SeriesProps>) => void;
}

export type LineChartProps = ComponentProps & typeof PlotlyChartActions;

class LineChart extends Component<LineChartProps & LineChartState> {
    static defaultProps: Partial<LineChartProps> = {
        type: "line"
    };
    private tooltipNode?: HTMLDivElement;
    private chartNode?: HTMLDivElement;

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: "widget-charts-line-alert" }, this.props.alertMessage);
        }
        if (this.props.devMode === "developer" && this.props.playground) {
            return this.renderPlayground();
        }

        return this.renderChart();
    }

    componentDidMount() {
        if (this.props.devMode === "developer" && this.props.loadPlayground) {
            store.dispatch(this.props.loadPlayground(this.props.friendlyId));
        }
        this.updateData(this.props);
    }

    componentWillReceiveProps(nextProps: LineChartProps) {
        this.updateData(nextProps);
    }

    private getTooltipNodeRef = (node: HTMLDivElement) => {
        this.tooltipNode = node;
    }

    private renderChart(): ReactElement<any> {
        return createElement(PlotlyChart,
            {
                type: getChartType(this.props.type),
                widgetID: this.props.friendlyId,
                className: this.props.class,
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) },
                onClick: this.onClick,
                onHover: this.onHover,
                onRestyle: this.onRestyle,
                getTooltipNode: this.getTooltipNodeRef,
                onResize: this.onLoadAndResize
            }
        );
    }

    private renderPlayground(): ReactElement<any> | null {
        if (this.props.playground) {
            return createElement(this.props.playground, {
                series: this.props.series,
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

    private updateData(props: LineChartProps) {
        if (!props.alertMessage && !props.fetchingData) {
            props.updateData(props.friendlyId, {
                layout: this.getLayoutOptions(props),
                data: this.getData(props),
                config: this.getConfigOptions(props)
            });
        }
    }

    private getData(props: LineChartProps) {
        if (props.type === "area" && props.area === "stacked") {
            return getStackedArea(props.scatterData || []);
        }
        if (props.type === "bubble" && this.chartNode && props.scatterData) {
            return calculateBubbleSize(props.series, props.scatterData, getDimensionsFromNode(this.chartNode));
        }

        return props.scatterData || [];
    }

    private getLayoutOptions(props: LineChartProps): Partial<Layout> {
        const advancedOptions = parseAdvancedOptions(props.devMode, props.layoutOptions);

        return deepMerge.all([ this.getModelerLayoutOptions(props), advancedOptions ]);
    }

    private getModelerLayoutOptions(props: LineChartProps): Partial<Layout> {
        const themeLayoutOptions = props.devMode !== "basic" ? props.themeConfigs.layout : {};

        return deepMerge.all([
            getDefaultLayoutOptions(),
            getCustomLayoutOptions(props),
            themeLayoutOptions
        ]);
    }

    public getConfigOptions(props: LineChartProps): Partial<Config> {
        const advancedOptions = parseAdvancedOptions(props.devMode, props.configurationOptions);

        return deepMerge.all([ getDefaultConfigOptions(), props.themeConfigs.configuration, advancedOptions ]);
    }

    private getModelerSeriesOptions(props: LineChartProps): string[] {
        const themeSeriesOptions = props.devMode !== "basic" ? props.themeConfigs.data : {};

        return props.series
            ? props.series.map((series, index) => {
                const customOptions = getCustomSeriesOptions(series, props, index);
                const seriesOptions = deepMerge.all([ getDefaultSeriesOptions(), customOptions, themeSeriesOptions ]);

                return JSON.stringify(seriesOptions, null, 2);
            })
            : [];
    }

    private onClick = ({ points }: ScatterHoverData<mendix.lib.MxObject>) => {
        const { customdata, data, x, y } = points[0];
        if (this.props.onClick) {
            this.props.onClick({
                mxObject: customdata,
                options: data.series,
                mxForm: this.props.mxform,
                trace: {
                    x: x as string,
                    y: y as number,
                    size: (points[0] as any)["marker.size"]
                } as any // FIXME: some type issue making noise here
            });
        }
    }

    private onHover = ({ event, points }: ScatterHoverData<mendix.lib.MxObject>) => {
        const { customdata, data, r, x, y, text } = points[0];
        if (event && this.tooltipNode) {
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
                            x: x as string,
                            y: y as number,
                            size: (points[0] as any)["marker.size"]
                        } as any // FIXME: some type issue making noise here
                    });
                } else if (points[0].data.hoverinfo === "none" as any) {
                    render(createElement(HoverTooltip, { text: text || y || r }), this.tooltipNode);
                } else {
                    this.tooltipNode.style.opacity = "0";
                }
            }
        }
    }

    private onRestyle = (data: any[]) => {
        if (this.props.scatterData) {
            const scatterData = this.props.scatterData.slice();
            (scatterData as any)[data[1][0]].visible = data[0].visible[0];

            this.props.updateData(this.props.friendlyId, {
                layout: this.getLayoutOptions(this.props),
                data: this.getData(this.props),
                config: this.getConfigOptions(this.props)
            });
        }
    }

    private onOptionsUpdate = (layoutOptions: string, seriesOptions: string[], configurationOptions: string) => {
        const updatedScatterData = seriesOptions.map((option, index) => {
            const rawOptions = option ? JSON.parse(option) : {};
            if (rawOptions.visible) {
                const { scatterData } = this.props;
                (scatterData as any)[index].visible = rawOptions.visible;

                return (scatterData as any)[index];
            }

            return (this.props.scatterData as any)[index];
        });
        this.props.updateDataFromPlayground(
            this.props.friendlyId,
            updatedScatterData,
            layoutOptions,
            seriesOptions,
            configurationOptions
        );
    }

    private onLoadAndResize = (node: HTMLDivElement) => {
        if (node && !this.chartNode) {
            this.chartNode = node;
            this.props.updateData(this.props.friendlyId, {
                layout: this.getLayoutOptions(this.props),
                data: this.getData(this.props),
                config: this.getConfigOptions(this.props)
            });
        }
    }
}

const mapDispatchToProps: MapDispatchToProps<typeof PlotlyChartActions, ComponentProps> = dispatch =>
    bindActionCreators(PlotlyChartActions, dispatch);
export default connect(null, mapDispatchToProps)(LineChart);
