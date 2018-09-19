import { CSSProperties, Component, createElement } from "react";
import { MapDispatchToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as classNames from "classnames";
import deepMerge from "deepmerge";

import { ChartLoading } from "./ChartLoading";
import { Data, PieHoverData, ScatterData, ScatterHoverData } from "plotly.js";
import * as PlotlyChartActions from "./actions/PlotlyChartActions";
import { Plotly, PlotlyChartInstance } from "./reducers/PlotlyChartReducer";
import ReactResizeDetector from "react-resize-detector";
import { getDimensionsFromNode } from "../utils/style";

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

type PlotlyChartProps = ComponentProps & typeof PlotlyChartActions & PlotlyChartInstance;

class PlotlyChart extends Component<PlotlyChartProps> {
    private chartNode?: HTMLDivElement;
    private tooltipNode?: HTMLDivElement;
    private timeoutId?: number;

    render() {
        return createElement("div",
            {
                className: classNames(`widget-charts widget-charts-${this.props.type}`, this.props.className, {
                    loading: this.props.loadingData
                }),
                style: this.props.style
            },
            this.renderChartNode(),
            createElement(ReactResizeDetector, { handleWidth: true, handleHeight: true, onResize: this.onResize }),
            createElement("div", { className: "widget-charts-tooltip", ref: this.getTooltipNodeRef }),
            this.renderLoadingIndicator()
        );
    }

    componentDidMount() {
        if (!this.props.loadingAPI && !this.props.plotly) {
            this.props.togglePlotlyAPILoading(this.props.widgetID, true, this.props.plotly);
        }
        this.fetchPlotly()
            .then(plotly => {
                if (this.props.onRender && this.chartNode) {
                    this.props.onRender(this.chartNode);
                }
                if (this.props.loadingAPI) {
                    this.props.togglePlotlyAPILoading(this.props.widgetID, false, plotly);
                }
            });
    }

    componentDidUpdate() {
        if (!this.props.loadingAPI && !this.props.loadingData && this.props.plotly) {
            this.renderChart(this.props, this.props.plotly);
        }
    }

    componentWillUnmount() {
        if (this.chartNode && this.props.plotly) {
            this.props.plotly.purge(this.chartNode);
        }
    }

    private renderChartNode() {
        return !this.props.loadingAPI ? createElement("div", { ref: this.getPlotlyNodeRef }) : null;
    }

    private renderLoadingIndicator() {
        return this.props.loadingAPI || this.props.loadingData ? createElement(ChartLoading) : null;
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
        const rootNode = this.chartNode && this.chartNode.parentElement as HTMLDivElement;
        if (this.chartNode && rootNode && !this.props.loadingAPI && layout && data && config) {
            const data2 = (data as Data[]).map(data_ => {
                if (data_.customdata) {
                    const customdata = data_.customdata.map(dataObject => ({
                        entity: dataObject.getEntity() as string,
                        guid: dataObject.getGuid() as string
                    }));

                    return { ...data_, customdata };
                }

                return { ...data_, customdata: [] };
            });
            const layoutOptions = deepMerge.all([ layout, getDimensionsFromNode(rootNode) ]);
            const plotlyConfig = window.dojo && window.dojo.locale ? { ...config, locale: window.dojo.locale } : config;
            plotly.newPlot(this.chartNode, data2 as Data[], layoutOptions, plotlyConfig)
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
                const modules = [ await import("plotly.js/lib/bar"), await import("plotly.js/lib/scatter") ];
                const scatterData = this.props.data && this.props.data as ScatterData[];

                if (scatterData && scatterData.filter(data => data.transforms).length) {
                    modules.push(await import("plotly.js/lib/aggregate"));
                }

                register(modules);
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
        if (!this.props.loadingAPI && !this.props.loadingData) {
            this.timeoutId = window.setTimeout(() => {
                if (this.props.plotly && this.chartNode) {
                    this.renderChart(this.props, this.props.plotly);
                    if (this.props.onResize) {
                        this.props.onResize(this.chartNode);
                    }
                }
            }, 100);
        }
    }
}

const mapDispatchToProps: MapDispatchToProps<typeof PlotlyChartActions, ComponentProps> = dispatch =>
    bindActionCreators(PlotlyChartActions, dispatch);
export default connect(null, mapDispatchToProps)(PlotlyChart);
