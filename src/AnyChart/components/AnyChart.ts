
// tslint:disable no-console
import { Component, ReactChild, createElement } from "react";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import { PlotlyChart } from "../../components/PlotlyChart";

import { arrayMerge } from "../../utils/data";
import deepMerge from "deepmerge";
import { Style } from "../../utils/namespaces";
import { Config, Layout } from "plotly.js";
import { getDimensions, parseStyle } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

import "../../ui/Charts.scss";
// TODO improve typing by replace explicit any types

export interface AnyChartProps extends WrapperProps, Style.Dimensions {
    alertMessage?: ReactChild;
    loading?: boolean;
    dataStatic: string;
    layoutStatic: string;
    attributeData: string;
    attributeLayout: string;
    configurationOptions: string;
    onClick?: (data: any) => void;
    onHover?: (data: any, node: HTMLDivElement) => void;
}

export class AnyChart extends Component<AnyChartProps, { alertMessage?: ReactChild }> {
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

    private renderChart() {
        return createElement(PlotlyChart, {
            type: "full",
            className: this.props.class,
            style: { ...getDimensions(this.props), ...parseStyle(this.props.style) },
            layout: this.getLayoutOptions(this.props),
            data: this.getData(this.props),
            config: this.getConfigOptions(this.props),
            onClick: this.onClick
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
            this.props.onClick(this.extractRelevantPointData(points));
        }
    }

    private extractRelevantPointData(points: any[]): any[] {
        const excludedKeys = [ "fullData", "xaxis", "yaxis", "data" ];

        return points.map((point) => {
            const result: any = {};
            for (const key in point) {
                if (excludedKeys.indexOf(key) === -1 && point.hasOwnProperty(key)) {
                    result[key] = point[key];
                }
            }

            return result;
        });
    }

    public getConfigOptions(props: AnyChartProps): Partial<Config> {
        const parsedConfig = JSON.parse(props.configurationOptions || "{}");

        return deepMerge.all([ { displayModeBar: false, doubleClick: false }, parsedConfig ]);
    }
}
