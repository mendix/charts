import { ScatterData, ScatterHoverData } from "plotly.js";
import { Component, ReactChild, ReactElement, createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { MapDispatchToProps, MapStateToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";

import { BarChartState } from "../store/BarChartReducer";
import { Container, Data } from "../../utils/namespaces";
import { BarChartDataHandlerProps } from "./BarChartDataHandler";
import {
    getConfigOptions,
    getDefaultConfigOptions,
    getLayoutOptions,
    getModelerLayoutOptions,
    getModelerSeriesOptions
} from "../utils/configs";
import { HoverTooltip } from "../../components/HoverTooltip";
import { Alert } from "../../components/Alert";
import PlotlyChart from "../../components/PlotlyChart";
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";
import { PlotlyChartInstance, defaultPlotlyInstanceState } from "../../components/reducers/PlotlyChartReducer";
import { DefaultReduxStore, store } from "../../store";
import { getDimensions, getTooltipCoordinates, parseStyle, setTooltipPosition } from "../../utils/style";

import "../../ui/Charts.scss";

interface ComponentProps extends BarChartDataHandlerProps {
    alertMessage?: ReactChild;
    onClick?: (options: Data.OnClickOptions<{ x: string, y: number }, Data.SeriesProps>) => void;
    onHover?: (options: Data.OnHoverOptions<{ x: string, y: number }, Data.SeriesProps>) => void;
}

export type BarChartProps = ComponentProps & typeof PlotlyChartActions & PlotlyChartInstance;

class BarChart extends Component<BarChartProps & BarChartState> {
    private tooltipNode?: HTMLDivElement;

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: "widget-charts-bar-alert" }, this.props.alertMessage);
        }
        if (this.props.devMode === "developer" && this.props.playground) {
            return this.renderPlayground();
        }

        return this.renderChart();
    }

    componentDidMount() {
        if (this.props.devMode === "developer" && this.props.loadPlayground) {
            store.dispatch(this.props.loadPlayground(this.props.instanceID));
        }
        if (this.props.updatingData) {
            this.updateData(this.props);
        }
    }

    componentWillReceiveProps(nextProps: BarChartProps) {
        const doneFetching = !nextProps.fetchingData && this.props.fetchingData;

        if (!nextProps.alertMessage && (doneFetching || nextProps.updatingData)) {
            this.updateData(nextProps);
        }
        if (nextProps.updatingData) {
            nextProps.toggleUpdatingData(nextProps.instanceID, false);
        }
    }

    private getTooltipNodeRef = (node: HTMLDivElement) => {
        this.tooltipNode = node;
    }

    private renderChart() {
        const playgroundLoaded = this.props.devMode !== "developer" || !!this.props.playground;

        return createElement(PlotlyChart,
            {
                type: "bar",
                widgetID: this.props.instanceID,
                loadingAPI: this.props.loadingAPI && playgroundLoaded,
                loadingData: this.props.fetchingData,
                layout: this.props.layout,
                data: this.props.data,
                config: this.props.config,
                plotly: this.props.plotly,
                className: this.props.class,
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) },
                onClick: this.onClick,
                onHover: this.onHover,
                getTooltipNode: this.getTooltipNodeRef
            }
        );
    }

    private renderPlayground(): ReactElement<any> | null {
        if (this.props.playground) {
            return createElement(this.props.playground, {
                series: this.props.series,
                seriesOptions: this.props.seriesOptions || [],
                modelerSeriesConfigs: getModelerSeriesOptions(this.props),
                onChange: this.onOptionsUpdate,
                layoutOptions: this.props.layoutOptions || "{\n\n}",
                configurationOptions: this.props.configurationOptions || "{\n\n}",
                configurationOptionsDefault: JSON.stringify(getDefaultConfigOptions(), null, 2),
                modelerLayoutConfigs: JSON.stringify(getModelerLayoutOptions(this.props), null, 2)
            }, this.renderChart());
        }

        return null;
    }

    private updateData(props: BarChartProps) {
        props.updateData(props.instanceID, {
            layout: getLayoutOptions(props),
            data: props.scatterData || [],
            config: getConfigOptions(props)
        });
    }

    private onClick = ({ points }: ScatterHoverData<Container.MxClick>) => {
        const { customdata, data, x, y } = points[0];
        if (this.props.onClick) {
            this.props.onClick({
                mxObjectCustom: customdata,
                options: data.series,
                mxForm: this.props.mxform,
                trace: {
                    x: this.props.orientation === "bar" ? y as string : x as string,
                    y: this.props.orientation === "bar" ? x as number : y as number
                }
            });
            window.isHovered = true;
        }
    }

    private onHover = ({ event, points }: ScatterHoverData<Container.MxClick>) => {
        const { customdata, data, x, y } = points[0];
        if (event && this.tooltipNode && this.tooltipNode.style.opacity !== "1" && !window.isHovered) {
            unmountComponentAtNode(this.tooltipNode);
            const coordinates = getTooltipCoordinates(event, this.tooltipNode);
            if (coordinates) {
                setTooltipPosition(this.tooltipNode, coordinates);
                if (data.series.tooltipForm && this.props.onHover) {
                    this.tooltipNode.innerHTML = "";
                    this.props.onHover({
                        tooltipForm: data.series.tooltipForm,
                        tooltipNode: this.tooltipNode,
                        mxObjectCustom: customdata,
                        options: data.series,
                        trace: {
                            x: this.props.orientation === "bar" ? y as string : x as string,
                            y: this.props.orientation === "bar" ? x as number : y as number
                        }
                    });
                    window.isHovered = true;
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
            this.props.updateDataFromPlayground(
                this.props.instanceID,
                this.props.scatterData,
                layoutOptions,
                seriesOptions,
                configurationOptions
            );
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

const mapStateToProps: MapStateToProps<PlotlyChartInstance, ComponentProps, DefaultReduxStore> = (state, props) =>
    state.plotly[props.instanceID] || defaultPlotlyInstanceState;
const mapDispatchToProps: MapDispatchToProps<typeof PlotlyChartActions, ComponentProps> = dispatch =>
    bindActionCreators(PlotlyChartActions, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(BarChart);
