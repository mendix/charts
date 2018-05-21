import * as classNames from "classnames";
import deepMerge from "deepmerge";
import { Config, Data, Layout, PieHoverData, PlotlyHTMLElement, Root, ScatterHoverData } from "plotly.js";
import { CSSProperties, Component, createElement } from "react";
import { MapDispatchToProps, MapStateToProps, connect } from "react-redux";
import ReactResizeDetector from "react-resize-detector";
import { bindActionCreators } from "redux";
import { getDimensionsFromNode } from "../utils/style";
import { ChartLoading } from "./ChartLoading";
import * as PlotlyChartActions from "./actions/PlotlyChartActions";
import { PlotlyChartInstanceState, PlotlyChartState, defaultPlotlyInstanceState } from "./reducers/PlotlyChartReducer";

export interface ComponentProps {
    widgetID: string;
    type: "line" | "bar" | "pie" | "heatmap" | "full" | "polar";
    className?: string;
    style?: CSSProperties;
    onClick?: (data: ScatterHoverData<any> | PieHoverData) => void;
    onHover?: (data: ScatterHoverData<any> | PieHoverData) => void;
    onRestyle?: (data: any) => void;
    getTooltipNode?: (node: HTMLDivElement) => void;
    onRender?: (node: HTMLDivElement) => void;
    onResize?: (node: HTMLDivElement) => void;
}

type PlotlyChartProps = ComponentProps & typeof PlotlyChartActions & PlotlyChartInstanceState;

interface Plotly {
    newPlot: (root: Root, data: Data[], layout?: Partial<Layout>, config?: Partial<Config>) => Promise<PlotlyHTMLElement>;
    purge: (root: Root) => void;
    relayout?: (root: Root, layout: Partial<Layout>) => Promise<PlotlyHTMLElement>;
}

export class PlotlyChart extends Component<PlotlyChartProps, { loading: boolean }> {
    state = { loading: true };
    private chartNode?: HTMLDivElement;
    private rootNode?: HTMLDivElement;
    private tooltipNode?: HTMLDivElement;
    private timeoutId?: number;
    private plotly?: Plotly;

    render() {
        return createElement("div",
            {
                className: classNames(`widget-charts widget-charts-${this.props.type}`, this.props.className),
                ref: this.getRootNodeRef,
                style: this.props.style
            },
            this.renderChartNode(),
            createElement(ReactResizeDetector, { handleWidth: true, handleHeight: true, onResize: this.onResize }),
            createElement("div", { className: "widget-charts-tooltip", ref: this.getTooltipNodeRef }),
            this.renderLoadingIndicator()
        );
    }

    componentDidMount() {
        this.props.initialiseInstanceState(this.props.widgetID);
        if (!this.props.loadingAPI) {
            this.props.togglePlotlyAPILoading(this.props.widgetID);
        }
        this.fetchPlotly()
            .then(plotly => {
                this.plotly = plotly;
                if (this.props.onRender && this.chartNode) {
                    this.props.onRender(this.chartNode);
                }
                if (this.props.loadingAPI) {
                    this.props.togglePlotlyAPILoading(this.props.widgetID);
                }
            });
    }

    componentDidUpdate() {
        if (!this.props.loadingAPI && !this.props.loadingData && this.plotly) {
            this.renderChart(this.props, this.plotly);
        }
    }

    componentWillUnmount() {
        if (this.chartNode && this.plotly) {
            this.plotly.purge(this.chartNode);
        }
    }

    private renderChartNode() {
        return !this.props.loadingAPI && !this.props.loadingData
            ? createElement("div", { ref: this.getPlotlyNodeRef })
            : null;
    }

    private renderLoadingIndicator() {
        return this.props.loadingAPI || this.props.loadingData ? createElement(ChartLoading) : null;
    }

    private getRootNodeRef = (node: HTMLDivElement) => {
        if (node) {
            this.rootNode = node;
        }
    }

    private getPlotlyNodeRef = (node: HTMLDivElement) => {
        if (node) {
            this.chartNode = node;
        }
    }

    private getTooltipNodeRef = (node: HTMLDivElement) => {
        this.tooltipNode = node;
        if (this.props.getTooltipNode) {
            this.props.getTooltipNode(node);
        }
    }

    private renderChart({ config, data, layout, onClick, onHover, onRestyle }: PlotlyChartProps, plotly: Plotly) {
        if (this.chartNode && this.rootNode && !this.props.loadingAPI && layout && data && config) {
            const layoutOptions = deepMerge.all([ layout, getDimensionsFromNode(this.rootNode) ]);
            const plotlyConfig = window.dojo && window.dojo.locale
                ? { ...config, locale: window.dojo.locale }
                : config;
            plotly.newPlot(this.chartNode, data as Data[], layoutOptions, plotlyConfig)
                .then(myPlot => {
                    if (onClick) {
                        myPlot.on("plotly_click", onClick as any);
                    }
                    if (onHover) {
                        myPlot.on("plotly_hover", onHover as any);
                    }
                    myPlot.on("plotly_unhover", this.clearTooltip);
                    if (onRestyle) {
                        myPlot.on("plotly_restyle", onRestyle as any);
                    }
                });
        }
    }

    private async fetchPlotly(): Promise<Plotly> {
        if (this.props.type === "full") {
            const { newPlot, purge } = await import("plotly.js/dist/plotly");

            return { newPlot, purge };
        } else {
            const { newPlot, purge, register } = await import("../PlotlyCustom");
            if (this.props.type === "pie") {
                register([ await import("plotly.js/lib/pie") ]);
            }
            if (this.props.type === "bar" || this.props.type === "line") {
                register([ await import("plotly.js/lib/bar"), await import("plotly.js/lib/scatter") ]);
            }
            if (this.props.type === "heatmap") {
                register([ await import("plotly.js/lib/heatmap") ]);
            }

            return { newPlot, purge };
        }
    }

    private clearTooltip = () => {
        if (this.tooltipNode) {
            this.tooltipNode.style.opacity = "0";
        }
    }

    private onResize = () => {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = window.setTimeout(() => {
            if (this.plotly && this.chartNode) {
                this.renderChart(this.props, this.plotly);
                if (this.props.onResize) {
                    this.props.onResize(this.chartNode);
                }
            }
        }, 100);
    }
}

const mapStateToProps: MapStateToProps<PlotlyChartInstanceState, ComponentProps, { plotly: PlotlyChartState }> = (state, props) =>
    state.plotly[props.widgetID] || defaultPlotlyInstanceState;
const mapDispatchToProps: MapDispatchToProps<typeof PlotlyChartActions, ComponentProps> = dispatch => bindActionCreators(PlotlyChartActions, dispatch);
export const PlotlyReduxContainer = connect(mapStateToProps, mapDispatchToProps)(PlotlyChart);
