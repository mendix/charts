import { ScatterHoverData } from "plotly.js";
import { Component, ReactChild, ReactElement, createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { bindActionCreators } from "redux";
import { MapDispatchToProps, MapStateToProps, connect } from "react-redux";

import "../../ui/Charts.scss";
import {
    getChartType,
    getModelerLayoutOptions,
    getModelerSeriesOptions,
    getScatterConfigOptions,
    parseScatterData,
    parseScatterLayoutOptions } from "../utils/configs";
import { getDefaultConfigOptions } from "../../BarChart/utils/configs";
import { LineChartState } from "../store/LineChartReducer";
import { Data } from "../../utils/namespaces";
import { DefaultReduxStore, store } from "../../store";
import {
    getDimensions,
    getTooltipCoordinates,
    parseStyle,
    setTooltipPosition } from "../../utils/style";

import { Alert } from "../../components/Alert";
import { HoverTooltip } from "../../components/HoverTooltip";
import { LineChartDataHandlerProps } from "./LineChartDataHandler";
import PlotlyChart from "../../components/PlotlyChart";
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";
import { PlotlyChartInstance, defaultPlotlyInstanceState } from "../../components/reducers/PlotlyChartReducer";

interface ComponentProps extends LineChartDataHandlerProps {
    alertMessage?: ReactChild;
    onClick?: (options: Data.OnClickOptions<{ x: string, y: number }, Data.SeriesProps>) => void;
    onHover?: (options: Data.OnHoverOptions<{ x: string, y: number }, Data.SeriesProps>) => void;
}

export type LineChartProps = ComponentProps & typeof PlotlyChartActions & PlotlyChartInstance;

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
        if (this.props.updatingData) {
            this.updateData(this.props);
        }
    }

    componentWillReceiveProps(nextProps: LineChartProps) {
        const doneFetching = !nextProps.fetchingData && this.props.fetchingData;

        if (!nextProps.alertMessage && (doneFetching || nextProps.updatingData)) {
            this.updateData(nextProps);
        }
        if (nextProps.updatingData) {
            nextProps.toggleUpdatingData(nextProps.friendlyId, false);
        }
    }

    private getTooltipNodeRef = (node: HTMLDivElement) => {
        this.tooltipNode = node;
    }

    private renderChart(): ReactElement<any> {
        const playgroundLoaded = this.props.devMode !== "developer" || !!this.props.playground;

        return createElement(PlotlyChart,
            {
                type: getChartType(this.props.type),
                widgetID: this.props.friendlyId,
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

    private updateData(props: LineChartProps) {
        props.updateData(props.friendlyId, {
            layout: parseScatterLayoutOptions(props),
            data: parseScatterData(props, this.chartNode),
            config: getScatterConfigOptions(props)
        });
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
                layout: parseScatterLayoutOptions(this.props),
                data: parseScatterData(this.props, this.chartNode),
                config: getScatterConfigOptions(this.props)
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
                layout: parseScatterLayoutOptions(this.props),
                data: parseScatterData(this.props, this.chartNode),
                config: getScatterConfigOptions(this.props)
            });
        }
    }
}

const mapStateToProps: MapStateToProps<PlotlyChartInstance, ComponentProps, DefaultReduxStore> = (state, props) =>
    state.plotly[props.friendlyId] || defaultPlotlyInstanceState;
const mapDispatchToProps: MapDispatchToProps<typeof PlotlyChartActions, ComponentProps> = dispatch =>
    bindActionCreators(PlotlyChartActions, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(LineChart);
