import { Component, createElement } from "react";
import * as classNames from "classnames";

import { Plots, newPlot, purge } from "plotly.js/dist/plotly-basic";
import { Dimensions, getDimensions } from "../../utils/style";

export interface BarChartProps extends Dimensions {
    config?: Partial<Plotly.Config>;
    data?: Plotly.ScatterData[];
    layout?: Partial<Plotly.Layout>;
    style?: object;
    className?: string;
    onClickAction?: () => void;
}

export class BarChart extends Component<BarChartProps, {}> {
    private barChartNode: HTMLDivElement;
    private data: Partial<Plotly.ScatterData>[] = [
        {
            type: "bar",
            x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4", "Sample 5", "Sample 6", "Sample 7" ],
            y: [ 20, 14, 23, 25, 50, 32, 44 ]
        }
    ];

    constructor(props: BarChartProps) {
        super(props);

        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    render() {
        return createElement("div", {
            className: classNames("widget-charts-bar", this.props.className),
            ref: this.getPlotlyNodeRef,
            style: { ...getDimensions(this.props), ...this.props.style }
        });
    }

    componentDidMount() {
        this.renderChart(this.props);
        this.setUpEvents();
    }

    componentWillReceiveProps(newProps: BarChartProps) {
        this.renderChart(newProps);
    }

    componentWillUnmount() {
        if (this.barChartNode) {
            purge(this.barChartNode);
        }
        window.removeEventListener("resize", this.onResize);
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.barChartNode = node;
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

    private renderChart(props: BarChartProps) {
        if (this.barChartNode) {
            const data = props.data && props.data.length ? props.data : this.data;
            newPlot(this.barChartNode, data, props.layout, props.config)
                .then(myPlot => myPlot.on("plotly_click", () => {
                    if (props.onClickAction) {
                        props.onClickAction();
                    }
                }));
        }
    }

    private onResize() {
        Plots.resize(this.barChartNode);
    }
}
