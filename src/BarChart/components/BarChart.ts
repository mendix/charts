import { Component, createElement } from "react";
import * as classNames from "classnames";

import * as Plotly from "plotly.js/dist/plotly";
import { Dimensions, getDimensions } from "../../utils/style";
import "core-js/es6/promise";

export interface BarChartProps extends Dimensions {
    config?: Partial<Plotly.Config>;
    data?: Plotly.ScatterData[];
    layout?: Partial<Plotly.Layout>;
    style?: object;
    className?: string;
    onClickAction?: () => void;
}

export class BarChart extends Component<BarChartProps, {}> {
    private intervalID: number | null;
    private plotlyNode: HTMLDivElement;
    private svg: SVGElement;
    private data: Partial<Plotly.ScatterData>[] = [ // tslint:disable-line
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
        this.adjustStyle();
        this.fixChartRendering();
    }

    componentWillReceiveProps(newProps: BarChartProps) {
        this.renderChart(newProps);
    }

    componentWillUnmount() {
        if (this.plotlyNode) {
            Plotly.purge(this.plotlyNode);
        }
        window.removeEventListener("resize", this.onResize);
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.plotlyNode = node;
    }

    private adjustStyle() {
        if (this.plotlyNode) {
            const wrapperElement = this.plotlyNode.parentElement;
            if (this.props.heightUnit === "percentageOfParent" && wrapperElement) {
                wrapperElement.style.height = "100%";
                wrapperElement.style.width = "100%";
            }
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

    private renderChart(props: BarChartProps) {
        if (this.plotlyNode) {
            const data = props.data && props.data.length ? props.data : this.data;
            Plotly.newPlot(this.plotlyNode, data, props.layout, props.config)
                .then(myPlot => myPlot.on("plotly_click", () => {
                    if (props.onClickAction) {
                        props.onClickAction();
                    }
                }));
        }
    }

    private onResize() {
        Plotly.Plots.resize(this.plotlyNode);
    }

    private fixChartRendering() {
        this.intervalID = setInterval(() => {
            if (this.svg && this.svg.parentElement && this.svg.parentElement.offsetHeight !== 0 && this.intervalID) {
                Plotly.Plots.resize(this.plotlyNode);
                clearInterval(this.intervalID);
                this.intervalID = null;
            }
        }, 100);
    }
}
