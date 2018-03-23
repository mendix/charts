
// tslint:disable no-console
import { Component, ReactChild, createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { HoverTooltip } from "../../components/HoverTooltip";
import { PlotlyChart } from "../../components/PlotlyChart";

import { arrayMerge } from "../../utils/data";
import deepMerge from "deepmerge";
import { Style } from "../../utils/namespaces";
import { Config, Layout } from "plotly.js";
import { getDimensions, getTooltipCoordinates, parseStyle, setTooltipPosition } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

import "../../ui/Charts.scss";
import { create } from "domain";
// TODO improve typing by replace explicit any types

export interface AnyChartProps extends WrapperProps, Style.Dimensions {
    alertMessage?: ReactChild;
    loading?: boolean;
    dataStatic: string;
    layoutStatic: string;
    attributeData: string;
    attributeLayout: string;
    onClick?: (data: any) => void;
    onHover?: (data: any, node: HTMLDivElement) => void;
}

export class AnyChart extends Component<AnyChartProps, { alertMessage?: ReactChild }> {
    private tooltipNode?: HTMLDivElement;

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: `widget-charts-any-alert` }, this.props.alertMessage);
        }
        if (this.props.loading) {
            return createElement(ChartLoading);
        }

        return this.renderChart();
    }

    componentWillReceiveProps(newProps: AnyChartProps) {
        this.setState({ alertMessage: newProps.alertMessage });
    }

    private getTooltipNodeRef = (node: HTMLDivElement) => {
        if (node) {
            this.tooltipNode = node;
        }
    }

    private renderChart() {
        return createElement(PlotlyChart, {
            type: "full",
            className: this.props.class,
            style: { ...getDimensions(this.props), ...parseStyle(this.props.style) },
            layout: this.getLayoutOptions(this.props),
            data: this.getData(this.props),
            config: AnyChart.getConfigOptions(),
            onClick: this.onClick,
            getTooltipNode: this.getTooltipNodeRef
        });
    }

    private getData(props: AnyChartProps): any[] {
        const staticData: any[] = JSON.parse(props.dataStatic || "[]");

        return props.attributeData
            ? deepMerge.all([ staticData, JSON.parse(props.attributeData) ], { arrayMerge })
            : staticData;
    }

    private getLayoutOptions(props: AnyChartProps): Partial<Layout> {
        const staticLayout = JSON.parse(props.layoutStatic || "{}");

        return props.attributeLayout
            ? deepMerge.all([ staticLayout, JSON.parse(props.attributeLayout) ], { arrayMerge }) as Partial<Layout>
            : staticLayout;
    }

    private onClick = ({ points }: any) => {
        if (this.props.onClick) {
            this.props.onClick(this.copyPoints(points));
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

    private static getConfigOptions(): Partial<Config> {
        return { displayModeBar: false, doubleClick: false };
    }
}
