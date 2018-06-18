
// tslint:disable no-console
import deepMerge from "deepmerge";
import { Config, Layout } from "plotly.js";
import { Component, ReactChild, createElement } from "react";
import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";
import PlotlyChart from "../../components/PlotlyChart";
import "../../ui/Charts.scss";
import { getDimensions, parseStyle } from "../../utils/style";
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";
import { AnyChartDataHandlerProps } from "./AnyChartDataHandler";
import { arrayMerge } from "../../utils/data";
import { MapDispatchToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";

// TODO improve typing by replace explicit any types

interface ComponentProps extends AnyChartDataHandlerProps {
    alertMessage?: ReactChild;
    onClick?: (data: any) => void;
    onHover?: (data: any, node: HTMLDivElement) => void;
}
export type AnyChartProps = ComponentProps & typeof PlotlyChartActions;

export class AnyChart extends Component<AnyChartProps> {
    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: `widget-charts-any-alert` }, this.props.alertMessage);
        }
        if (this.props.fetchingData) {
            return createElement(ChartLoading);
        }

        return this.renderChart();
    }

    componentWillReceiveProps(nextProps: AnyChartProps) {
        if (!nextProps.alertMessage && !nextProps.fetchingData) {
            nextProps.updateData(nextProps.friendlyId, {
                layout: this.getLayoutOptions(nextProps),
                data: this.getData(nextProps),
                config: this.getConfigOptions(nextProps)
            });
        }
    }

    private renderChart() {
        return createElement(PlotlyChart, {
            widgetID: this.props.friendlyId,
            type: "full",
            className: this.props.class,
            style: { ...getDimensions(this.props), ...parseStyle(this.props.style) },
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

const mapDispatchToProps: MapDispatchToProps<typeof PlotlyChartActions, ComponentProps> = dispatch =>
    bindActionCreators(PlotlyChartActions, dispatch);
export default connect(null, mapDispatchToProps)(AnyChart);
