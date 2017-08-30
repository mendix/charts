import { CSSProperties, Component, createElement } from "react";

import * as classNames from "classnames";
import { Plots, newPlot, purge } from "../../PlotlyCustom";

import { ChartType } from "./PieChartContainer";
import { PieData } from "../../../typings/plotly.js";
import { Dimensions, getDimensions } from "../../utils/style";

export interface PieChartProps extends Dimensions {
    data?: PieData[];
    config?: Partial<Plotly.Config>;
    layout?: Partial<Plotly.Layout>;
    type: ChartType;
    className?: string;
    style?: CSSProperties;
    onClickAction?: () => void;
}

export class PieChart extends Component<PieChartProps, {}> {
    private pieChartNode: HTMLDivElement;
    private data: PieData[] = [ {
        hole: this.props.type === "donut" ? .4 : 0,
        hoverinfo: "label+name",
        labels: [ "US", "China", "European Union", "Russian Federation", "Brazil", "India", "Rest of World" ],
        name: "GHG Emissions",
        type: "pie",
        values: [ 16, 15, 12, 6, 5, 4, 42 ]
    } ];

    constructor(props: PieChartProps) {
        super(props);

        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    render() {
        return createElement("div", {
            className: classNames(`widget-charts-${this.props.type}`, this.props.className),
            ref: this.getPlotlyNodeRef,
            style: { ...getDimensions(this.props), ...this.props.style }
        });
    }

    componentDidMount() {
        this.renderChart(this.props);
        this.setUpEvents();
    }

    componentWillReceiveProps(newProps: PieChartProps) {
        this.renderChart(newProps);
    }

    componentWillUnmount() {
        if (this.pieChartNode) {
            purge(this.pieChartNode);
        }
        window.removeEventListener("resize", this.onResize);
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.pieChartNode = node;
    }

    private renderChart(props: PieChartProps) {
        if (this.pieChartNode) {
            const data = props.data && props.data[0].values.length ? props.data : this.data;
            newPlot(this.pieChartNode, data as any, props.layout, props.config)
                .then(myPlot => myPlot.on("plotly_click", () => {
                    if (this.props.onClickAction) {
                        this.props.onClickAction();
                    }
                }));
        }
    }

    private setUpEvents() {
        // A workaround for attaching the resize event to the Iframe window because the plotly
        // library does not support it. This fix will be done in the web modeler preview class when the
        // plotly library starts supporting listening to Iframe events.
        const iFrame = document.getElementsByClassName("t-page-editor-iframe")[0] as HTMLIFrameElement;
        if (iFrame) {
            (iFrame.contentWindow || iFrame.contentDocument).addEventListener("resize", this.onResize);
        } else {
            window.addEventListener("resize", this.onResize);
        }
    }

    private onResize() {
        Plots.resize(this.pieChartNode);
    }
}
