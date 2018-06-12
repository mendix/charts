import deepMerge from "deepmerge";
import { Config, Layout, PieHoverData } from "plotly.js";
import { Component, ReactChild, ReactElement, createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { MapDispatchToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";

import { Alert } from "../../components/Alert";
import { HoverTooltip } from "../../components/HoverTooltip";
import PlotlyChart from "../../components/PlotlyChart";
import "../../ui/Charts.scss";
import { Container, Data } from "../../utils/namespaces";
import { getDimensions, getTooltipCoordinates, parseStyle, setTooltipPosition } from "../../utils/style";
import { PieChartDataHandlerProps } from "./PieChartDataHandler";
import { PiePlayground } from "./PiePlayground";
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";

import { parseAdvancedOptions } from "../../utils/data";
import { getDefaultDataOptions, getDefaultLayoutOptions } from "../utils/configs";
import PieChartContainerProps = Container.PieChartContainerProps;

interface ComponentProps extends PieChartDataHandlerProps {
    alertMessage?: ReactChild;
    onClick?: (options: Data.OnClickOptions<{ label: string, value: number }, PieChartContainerProps>) => void;
    onHover?: (options: Data.OnHoverOptions<{ label: string, value: number }, PieChartContainerProps>) => void;
}

export type PieChartProps = ComponentProps & typeof PlotlyChartActions;

interface PieChartState {
    layoutOptions: string;
    dataOptions: string;
    playgroundLoaded: boolean;
    configurationOptions: string;
}

export interface PieTraces {
    labels: string[];
    values: number[];
    colors: string[];
}

export class PieChart extends Component<PieChartProps, PieChartState> {
    state: PieChartState = {
        layoutOptions: this.props.layoutOptions,
        dataOptions: this.props.dataOptions,
        configurationOptions: this.props.configurationOptions,
        playgroundLoaded: false
    };
    private tooltipNode?: HTMLDivElement;
    private Playground?: typeof PiePlayground;

    constructor(props: PieChartProps) {
        super(props);

        if (props.devMode === "developer") {
            this.loadPlaygroundComponent();
        }
    }

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: `widget-charts-${this.props.chartType}-alert` },
                this.props.alertMessage
            );
        }
        if (this.props.devMode === "developer" && this.state.playgroundLoaded) {
            return this.renderPlayground();
        }

        return this.renderChart();
    }

    componentWillReceiveProps(nextProps: PieChartProps) {
        if (!nextProps.alertMessage && !nextProps.fetchingData) {
            nextProps.updateData(nextProps.friendlyId, {
                layout: this.getLayoutOptions(nextProps),
                data: nextProps.pieData,
                config: this.getConfigOptions(nextProps)
            });
        }
    }

    private async loadPlaygroundComponent() {
        const { PiePlayground: PlaygroundImport } = await import("./PiePlayground");
        this.Playground = PlaygroundImport;
        this.setState({ playgroundLoaded: true });
    }

    private getTooltipNodeRef = (node: HTMLDivElement) => {
        this.tooltipNode = node;
    }

    private renderChart() {
        return createElement(PlotlyChart,
            {
                widgetID: this.props.friendlyId,
                type: "pie",
                className: this.props.class,
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) },
                onClick: this.onClick,
                onHover: this.onHover,
                getTooltipNode: this.getTooltipNodeRef
            }
        );
    }

    private renderPlayground(): ReactElement<any> | null {
        if (this.Playground) {
            const { themeConfigs } = this.props;
            const modelerLayoutConfigs = deepMerge.all(
                [ getDefaultLayoutOptions(this.props), themeConfigs.layout ]
            );
            const modelerDataConfigs = deepMerge.all([ getDefaultDataOptions(this.props), themeConfigs.data ]);

            return createElement(this.Playground, {
                dataOptions: this.state.dataOptions || "{\n\n}",
                modelerDataConfigs: JSON.stringify(modelerDataConfigs, null, 2),
                onChange: this.onRuntimeUpdate,
                layoutOptions: this.state.layoutOptions || "{\n\n}",
                modelerLayoutConfigs: JSON.stringify(modelerLayoutConfigs, null, 2),
                configurationOptions: this.state.configurationOptions || "{\n\n}",
                configurationOptionsDefault: JSON.stringify(PieChart.getDefaultConfigOptions(), null, 2)
            }, this.renderChart());
        }

        return null;
    }

    // private getData(props: PieChartProps): PieData[] {
    //     if (props.data && props.data.length) {
    //         const { dataOptions } = this.state;
    //         const advancedOptions = props.devMode !== "basic" && dataOptions ? JSON.parse(dataOptions) : {};
    //         const dataThemeConfigs = props.devMode !== "basic" ? props.themeConfigs.data : {};

    //         return [
    //             {
    //                 ...deepMerge.all(
    //                     [
    //                         props.data[0],
    //                         dataThemeConfigs,
    //                         advancedOptions
    //                     ],
    //                     { arrayMerge }
    //                 ),
    //                 customdata: props.data[0].customdata
    //             }
    //         ];
    //     }

    //     return props.defaultData || [];
    // }

    private getLayoutOptions(props: PieChartProps): Partial<Layout> {
        const { layoutOptions } = this.state;
        const advancedOptions = props.devMode !== "basic" && layoutOptions ? JSON.parse(layoutOptions) : {};
        const themeLayoutConfigs = props.devMode !== "basic" ? props.themeConfigs.layout : {};

        return deepMerge.all([ getDefaultLayoutOptions(props), themeLayoutConfigs, advancedOptions ]);
    }

    private onClick = ({ points }: PieHoverData<mendix.lib.MxObject[]>) => {
        if (this.props.onClick && this.props.pieData) {
            const point = points[0];
            this.props.onClick({
                mxObject: point.customdata[0],
                options: this.props,
                mxForm: this.props.mxform,
                trace: {
                    label: point.label,
                    value: point.value
                }
            });
        }
    }

    private onHover = ({ event, points }: PieHoverData<mendix.lib.MxObject[]>) => {
        if (event && this.tooltipNode) {
            unmountComponentAtNode(this.tooltipNode);
            const coordinates = getTooltipCoordinates(event, this.tooltipNode);
            if (coordinates) {
                setTooltipPosition(this.tooltipNode, coordinates);
                if (this.props.onHover && this.props.pieData) {
                    const point = points[0];
                    this.props.onHover({
                        tooltipForm: this.props.tooltipForm,
                        tooltipNode: this.tooltipNode,
                        mxObject: point.customdata[0],
                        options: this.props,
                        trace: {
                            label: point.label,
                            value: point.value
                        }
                    });
                } else if (points[0].data.hoverinfo === "none") {
                    render(createElement(HoverTooltip, { text: points[0].label }), this.tooltipNode);
                } else {
                    this.tooltipNode.style.opacity = "0";
                }
            }
        }
    }

    private onRuntimeUpdate = (layoutOptions: string, dataOptions: string, configurationOptions: string) => {
        this.setState({ layoutOptions, dataOptions, configurationOptions });
    }

    private static getDefaultConfigOptions(): Partial<Config> {
        return { displayModeBar: false, doubleClick: false };
    }

    public getConfigOptions(props: PieChartProps): Partial<Config> {
        const advancedOptions = parseAdvancedOptions(props.devMode, props.configurationOptions);

        return deepMerge.all([ PieChart.getDefaultConfigOptions(), props.themeConfigs.configuration, advancedOptions ]);
    }
}

const mapDispatchToProps: MapDispatchToProps<typeof PlotlyChartActions, ComponentProps> = dispatch =>
    bindActionCreators(PlotlyChartActions, dispatch);
export default connect(null, mapDispatchToProps)(PieChart);
