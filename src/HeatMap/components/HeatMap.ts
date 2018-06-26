import { Alert } from "../../components/Alert";
import deepMerge from "deepmerge";
import { Component, ReactChild, ReactElement, createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { MapDispatchToProps, MapStateToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";
import { ScatterHoverData } from "plotly.js";
import { HoverTooltip } from "../../components/HoverTooltip";
import PlotlyChart from "../../components/PlotlyChart";
import { arrayMerge } from "../../utils/configs";
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";
import { Container, Data } from "../../utils/namespaces";
import { getDimensions, getTooltipCoordinates, parseStyle, setTooltipPosition } from "../../utils/style";

import { HeatMapDataHandlerProps } from "./HeatMapDataHandler";
import { HeatMapState } from "../store/HeatMapReducer";
import {
    getConfigOptions,
    getData,
    getDefaultConfigOptions,
    getDefaultDataOptions,
    getDefaultLayoutOptions,
    getLayoutOptions } from "../utils/configs";
import { DefaultReduxStore, store } from "../../store";
import HeatMapContainerProps = Container.HeatMapContainerProps;
import "../../ui/Charts.scss";
import { PlotlyChartInstance, defaultPlotlyInstanceState } from "../../components/reducers/PlotlyChartReducer";

interface ComponentProps extends HeatMapDataHandlerProps {
    alertMessage?: ReactChild;
    onClick?: (options: Data.OnClickOptions<{ x: string, y: string, z: number }, HeatMapContainerProps>) => void;
    onHover?: (options: Data.OnHoverOptions<{ x: string, y: string, z: number }, HeatMapContainerProps>) => void;
}

export type HeatMapProps = ComponentProps & typeof PlotlyChartActions & PlotlyChartInstance;

class HeatMap extends Component<HeatMapProps & HeatMapState> {
    private tooltipNode?: HTMLDivElement;

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: `widget-heat-map-alert` },
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

    componentWillReceiveProps(nextProps: HeatMapProps) {
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
                type: "heatmap",
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
            const modelerLayoutConfigs = deepMerge.all(
                [ getDefaultLayoutOptions(this.props), this.props.themeConfigs.layout ]
            );
            const modelerDataConfigs = deepMerge.all(
                [ getDefaultDataOptions(this.props), this.props.themeConfigs.data ], { arrayMerge }
            );

            return createElement(this.props.playground, {
                dataOptions: this.props.dataOptions || "{\n\n}",
                modelerDataConfigs: JSON.stringify(modelerDataConfigs, null, 2),
                onChange: this.onOptionsUpdate,
                layoutOptions: this.props.layoutOptions || "{\n\n}",
                configurationOptions: this.props.configurationOptions || "{\n\n}",
                configurationOptionsDefault: JSON.stringify(getDefaultConfigOptions(), null, 2),
                modelerLayoutConfigs: JSON.stringify(modelerLayoutConfigs, null, 2)
            }, this.renderChart());
        }

        return null;
    }

    private updateData(props: HeatMapProps) {
        props.updateData(props.instanceID, {
            layout: getLayoutOptions(props),
            data: getData(props),
            config: getConfigOptions(props)
        });
    }

    private onClick = ({ points }: ScatterHoverData<any>) => {
        if (this.props.onClick) {
            const point = points[0];
            this.props.onClick({
                options: this.props,
                mxForm: this.props.mxform,
                trace: {
                    x: point.x as string,
                    y: point.y as string,
                    z: point.z as number
                }
            });
        }
    }

    private onHover = ({ points, event }: ScatterHoverData<any>) => {
        const { x, y, z, text } = points[0];
        if (event && this.tooltipNode) {
            unmountComponentAtNode(this.tooltipNode);
            const coordinates = getTooltipCoordinates(event, this.tooltipNode);
            if (coordinates) {
                setTooltipPosition(this.tooltipNode, coordinates);
                if (this.props.onHover) {
                    this.props.onHover({
                        tooltipForm: this.props.tooltipForm,
                        tooltipNode: this.tooltipNode,
                        options: this.props,
                        trace: {
                            x: x as string,
                            y: y as string,
                            z: z as number
                        }
                    });
                } else if (points[0].data.hoverinfo === "none" as any) {
                    render(createElement(HoverTooltip, { text: text || z }), this.tooltipNode);
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
export default connect(mapStateToProps, mapDispatchToProps)(HeatMap);
