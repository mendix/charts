import { Component, ReactChild, /*ReactElement, */createElement } from "react";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { PlotlyChart } from "./AnyPlotlyChart";

import deepMerge from "deepmerge";
import { Layout } from "plotly.js";
import { getDimensions, parseStyle } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

import "../../ui/Charts.scss";
// TODO improve typing by replace explicit any types

interface Dimensions {
    width: number;
    height: number;
    widthUnit: "percentage" | "pixels";
    heightUnit: "percentageOfWidth" | "pixels" | "percentageOfParent";
}

export interface AnyChartProps extends WrapperProps, Dimensions {
    alertMessage?: ReactChild;
    loading?: boolean;
    dataStatic: string;
    layoutStatic: string;
    attributeData: string;
    attributeLayout: string;
    onClick?: (data: any) => void;
    onHover?: (data: any, node: HTMLDivElement) => void;
}

export class AnyChart extends Component<AnyChartProps> {
    private tooltipNode: HTMLDivElement;

    constructor(props: AnyChartProps) {
        super(props);

        this.getTooltipNodeRef = this.getTooltipNodeRef.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onHover = this.onHover.bind(this);

        this.state = {
            layoutStatic: props.layoutStatic,
            dataStatic: props.dataStatic,
            attributeLayout: props.attributeLayout,
            attributeData: props.attributeData
        };
    }

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: `widget-charts-any-alert` },
                this.props.alertMessage
            );
        }
        if (this.props.loading) {
            return createElement(ChartLoading, { text: "Loading" });
        }

        return this.renderChart();
    }

    componentDidMount() {
        if (!this.props.loading) {
            this.renderChart();
        }
    }

    componentDidUpdate() {
        if (!this.props.loading) {
            this.renderChart();
        }
    }

    private getTooltipNodeRef(node: HTMLDivElement) {
        this.tooltipNode = node;
    }

    private renderChart() {
        const layout = this.getLayoutOptions(this.props);
        const data = this.getData(this.props);
        // logger.error("renderChart", layout, data);
        return createElement(PlotlyChart, {
            type: "any",
            className: this.props.class,
            style: { ...getDimensions(this.props), ...parseStyle(this.props.style) },
            layout,
            data,
            config: {},
            onClick: this.onClick,
            onHover: this.onHover,
            getTooltipNode: this.getTooltipNodeRef
        });
    }

    private getData(props: AnyChartProps): any[] {
            // const arrayMerge = (_destinationArray: any[], sourceArray: any[]) => {
            //     return sourceArray;
            // };
            try {
                const staticData = JSON.parse(props.dataStatic || "[]");
                if (props.attributeData) {
                    const attributeData = JSON.parse(props.attributeData);
                    return deepMerge.all([ staticData, attributeData ] /* , { arrayMerge } */);
                }
                return staticData;
            } catch (error) {
                // tslint:disable no-console
                console.error("Failed convert data into JSON: ", props.dataStatic, props.attributeData, error);
                return {} as any;
            }
    }

    private getLayoutOptions(props: AnyChartProps): Partial<Layout> {
        const arrayMerge = (_destinationArray: any[], sourceArray: any[]) => {
            return sourceArray;
        };
        try {
            const staticLayout = JSON.parse(props.layoutStatic || "{}");
            if (props.attributeData) {
                const attributeLayout = JSON.parse(props.attributeLayout);
                return deepMerge.all([ staticLayout, attributeLayout ], { arrayMerge }) as Partial<Layout>;
            }

            return staticLayout;

        } catch (error) {
            console.error("Failed convert layout to JSON: ", props.dataStatic, props.attributeData, error);
            return {} as any;
        }
    }

    private onClick({ points }: any) {
        // tslint:disable no-console
        console.log("implement click", arguments);
        if (this.props.onClick) {
            const result = this.copyPoints(points);
            this.props.onClick(result);
        }
    }

    private onHover({ points, event }: any) {
        // logger.error("implement hover", arguments);
        console.log("implement hover", arguments[0]);
        if (this.props.onHover) {
            const { x, xaxis, y, yaxis } = points[0];
            this.tooltipNode.innerHTML = "";
            if (xaxis && yaxis) {
                const positionYaxis = yaxis.l2p(y) + yaxis._offset;
                const positionXaxis = xaxis.d2p(x) + xaxis._offset;
                this.tooltipNode.style.top = `${positionYaxis}px`;
                this.tooltipNode.style.left = `${positionXaxis}px`;
            } else if (event) {
                // Does not work on 3D
                this.tooltipNode.style.top = `${event.clientY - 100}px`;
                this.tooltipNode.style.left = `${event.clientX}px`;
            } else {
                // TODO when if there is event? 3D charts?
                // https://plot.ly/javascript/3d-scatter-plots/
                // https://codepen.io/anon/pen/rYoaRV
            }

            this.tooltipNode.style.opacity = "1";
            const result = this.copyPoints(points);
            this.props.onHover(result, this.tooltipNode);
        }
    }

    private copyPoints(points: any[]): any[] {
        return points.map((point) => {
            const result: any = {};
            for (const key in point) {
                if (key !== "fullData" && key !== "xaxis" && key !== "yaxis" && point.hasOwnProperty(key)) {
                    result[key] = point[key];
                }
            }
            return result;
        });
    }

}
