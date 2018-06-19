import deepMerge from "deepmerge";
import { Config, HeatMapData, Layout, ScatterHoverData } from "plotly.js";
import { Component, ReactChild, ReactElement, createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { MapDispatchToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Alert } from "../../components/Alert";
import { HoverTooltip } from "../../components/HoverTooltip";
import PlotlyChart from "../../components/PlotlyChart";
import "../../ui/Charts.scss";
import { arrayMerge } from "../../utils/configs";
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";
import { Container, Data } from "../../utils/namespaces";
import { getDimensions, getTooltipCoordinates, parseStyle, setTooltipPosition } from "../../utils/style";

import HeatMapContainerProps = Container.HeatMapContainerProps;
import { HeatMapDataHandlerProps } from "./HeatMapDataHandler";
import { HeatMapState } from "../store/HeatMapReducer";
import { store } from "../store";
import { getDefaultConfigOptions, getDefaultDataOptions, getDefaultLayoutOptions } from "../utils/configs";

interface ComponentProps extends HeatMapDataHandlerProps {
    alertMessage?: ReactChild;
    onClick?: (options: Data.OnClickOptions<{ x: string, y: string, z: number }, HeatMapContainerProps>) => void;
    onHover?: (options: Data.OnHoverOptions<{ x: string, y: string, z: number }, HeatMapContainerProps>) => void;
}

export type HeatMapProps = ComponentProps & typeof PlotlyChartActions;

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
            store.dispatch(this.props.loadPlayground(this.props.friendlyId));
        }
    }

    componentWillReceiveProps(nextProps: HeatMapProps) {
        if (!nextProps.alertMessage && !nextProps.fetchingData) {
            nextProps.updateData(nextProps.friendlyId, {
                layout: this.getLayoutOptions(nextProps),
                data: this.getData(nextProps),
                config: this.getConfigOptions(nextProps)
            });
        }
    }

    private getTooltipNodeRef = (node: HTMLDivElement) => {
        this.tooltipNode = node;
    }

    private renderChart() {
        return createElement(PlotlyChart,
            {
                widgetID: this.props.friendlyId,
                type: "heatmap",
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

    private getData(props: HeatMapProps): HeatMapData[] {
        if (props.data) {
            const { dataOptions } = props;
            const advancedOptions = props.devMode !== "basic" && dataOptions ? JSON.parse(dataOptions) : {};
            const dataThemeConfigs = props.devMode !== "basic" ? props.themeConfigs.data : {};

            const data: HeatMapData = deepMerge.all([
                {
                    ...getDefaultDataOptions(props),
                    x: props.data.x,
                    y: props.data.y,
                    z: props.data.z,
                    text: props.data.z.map(row => row.map(item => `${item}`)),
                    zsmooth: props.smoothColor ? "best" : false
                },
                dataThemeConfigs,
                advancedOptions
            ], { arrayMerge });
            data.colorscale = advancedOptions.colorscale || data.colorscale;

            return [ data ];
        }

        return [];
    }

    private getLayoutOptions(props: HeatMapProps): Partial<Layout> {
        const { layoutOptions } = props;
        const advancedOptions = props.devMode !== "basic" && layoutOptions ? JSON.parse(layoutOptions) : {};
        const themeLayoutConfigs = props.devMode !== "basic" ? props.themeConfigs.layout : {};

        return deepMerge.all([
            getDefaultLayoutOptions(props),
            {
                annotations: props.showValues
                    ? this.getTextAnnotations(props.data, props.valuesColor)
                    : undefined
            },
            themeLayoutConfigs,
            advancedOptions
        ]);
    }

    private getTextAnnotations(data?: HeatMapData, valuesColor = "") {
        const annotations: {}[] = [];
        if (data) {
            for (let i = 0; i < data.y.length; i++) {
                for (let j = 0; j < data.x.length; j++) {
                    const result = {
                        xref: "x1",
                        yref: "y1",
                        x: data.x[ j ],
                        y: data.y[ i ],
                        text: data.z[ i ][ j ],
                        font: {
                            family: "Open Sans",
                            size: 14,
                            color: valuesColor || "#555"
                        },
                        showarrow: false
                    };
                    annotations.push(result);
                }
            }
        }

        return annotations;
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
            this.props.friendlyId,
            dataOptions,
            layoutOptions,
            configurationOptions
        );
    }

    public getConfigOptions(props: HeatMapProps): Partial<Config> {
        const parsedConfig = props.devMode !== "basic" && props.configurationOptions
            ? JSON.parse(props.configurationOptions)
            : {};

        return deepMerge.all(
            [ { displayModeBar: false, doubleClick: false }, props.themeConfigs.configuration, parsedConfig ],
            { arrayMerge }
        );
    }
}

const mapDispatchToProps: MapDispatchToProps<typeof PlotlyChartActions, ComponentProps> = dispatch =>
    bindActionCreators(PlotlyChartActions, dispatch);
export default connect(null, mapDispatchToProps)(HeatMap);
