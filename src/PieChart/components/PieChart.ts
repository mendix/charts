import deepMerge from "deepmerge";
import { PieHoverData } from "plotly.js";
import { Component, ReactChild, ReactElement, createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { MapDispatchToProps, MapStateToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";

import { Alert } from "../../components/Alert";
import { HoverTooltip } from "../../components/HoverTooltip";
import PlotlyChart from "../../components/PlotlyChart";
import "../../ui/Charts.scss";
import { Container, Data } from "../../utils/namespaces";
import { getDimensions, getTooltipCoordinates, parseStyle, setTooltipPosition } from "../../utils/style";
import { PieChartDataHandlerProps } from "./PieChartDataHandler";
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";

import {
    getConfigOptions,
    getData,
    getDefaultConfigOptions,
    getDefaultDataOptions,
    getDefaultLayoutOptions,
    getLayoutOptions } from "../utils/configs";
import PieChartContainerProps = Container.PieChartContainerProps;
import { DefaultReduxStore, store } from "../../store";
import { PieChartState } from "../store/PieChartReducer";
import { PlotlyChartInstance, defaultPlotlyInstanceState } from "../../components/reducers/PlotlyChartReducer";

interface ComponentProps extends PieChartDataHandlerProps {
    alertMessage?: ReactChild;
    onClick?: (options: Data.OnClickOptions<{ label: string, value: number }, PieChartContainerProps>) => void;
    onHover?: (options: Data.OnHoverOptions<{ label: string, value: number }, PieChartContainerProps>) => void;
}

export type PieChartProps = ComponentProps & typeof PlotlyChartActions & PlotlyChartInstance;

export interface PieTraces {
    labels: string[];
    values: number[];
    colors: string[];
}

class PieChart extends Component<PieChartProps & PieChartState> {
    private tooltipNode?: HTMLDivElement;

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: `widget-charts-${this.props.chartType}-alert` },
                this.props.alertMessage
            );
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
        // this.updateData(this.props);
    }

    componentWillReceiveProps(nextProps: PieChartProps) {
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
                widgetID: this.props.instanceID,
                type: "pie",
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
            const { themeConfigs } = this.props;
            const modelerLayoutConfigs = deepMerge.all(
                [ getDefaultLayoutOptions(this.props), themeConfigs.layout ]
            );
            const modelerDataConfigs = deepMerge.all([ getDefaultDataOptions(this.props), themeConfigs.data ]);

            return createElement(this.props.playground, {
                dataOptions: this.props.dataOptions || "{\n\n}",
                modelerDataConfigs: JSON.stringify(modelerDataConfigs, null, 2),
                onChange: this.onOptionsUpdate,
                layoutOptions: this.props.layoutOptions || "{\n\n}",
                modelerLayoutConfigs: JSON.stringify(modelerLayoutConfigs, null, 2),
                configurationOptions: this.props.configurationOptions || "{\n\n}",
                configurationOptionsDefault: JSON.stringify(getDefaultConfigOptions(), null, 2)
            }, this.renderChart());
        }

        return null;
    }

    private updateData(props: PieChartProps) {
        props.updateData(props.instanceID, {
            layout: getLayoutOptions(props),
            data: getData(props),
            config: getConfigOptions(props)
        });
    }

    private onClick = ({ points }: PieHoverData<Container.MxClick[]>) => {
        if (this.props.onClick && this.props.pieData) {
            const point = points[0];
            this.props.onClick({
                mxObjectCustom: point.customdata[0],
                options: this.props,
                mxForm: this.props.mxform,
                trace: {
                    label: point.label,
                    value: point.value
                }
            });
            window.isHovered = true;
        }
    }

    private onHover = ({ event, points }: PieHoverData<Container.MxClick[]>) => {
        if (event && this.tooltipNode && !window.isHovered) {
            unmountComponentAtNode(this.tooltipNode);
            const coordinates = getTooltipCoordinates(event, this.tooltipNode);
            if (coordinates) {
                setTooltipPosition(this.tooltipNode, coordinates);
                if (this.props.onHover && this.props.pieData) {
                    const point = points[0];
                    this.props.onHover({
                        tooltipForm: this.props.tooltipForm,
                        tooltipNode: this.tooltipNode,
                        mxObjectCustom: point.customdata[0],
                        options: this.props,
                        trace: {
                            label: point.label,
                            value: point.value
                        }
                    });
                    window.isHovered = true;
                } else if (points[0].data.hoverinfo === "none") {
                    render(createElement(HoverTooltip, { text: points[0].label }), this.tooltipNode);
                } else {
                    this.tooltipNode.style.opacity = "0";
                }
            }
        }
    }

    private onOptionsUpdate = (layoutOptions: string, dataOptions: string, configurationOptions: string) => {
        this.props.updateDataFromPlayground(
            this.props.instanceID,
            dataOptions,
            layoutOptions,
            configurationOptions
        );
    }
}

const mapStateToProps: MapStateToProps<PlotlyChartInstance, ComponentProps, DefaultReduxStore> = (state, props) =>
    state.plotly[props.instanceID] || defaultPlotlyInstanceState;
const mapDispatchToProps: MapDispatchToProps<typeof PlotlyChartActions, ComponentProps> = dispatch =>
    bindActionCreators(PlotlyChartActions, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(PieChart);
