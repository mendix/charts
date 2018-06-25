
// tslint:disable no-console
import { Component, ReactChild, createElement } from "react";
import { MapDispatchToProps, MapStateToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";
import deepMerge from "deepmerge";

import { Alert } from "../../components/Alert";
import { AnyChartDataHandlerProps } from "./AnyChartDataHandler";
import { arrayMerge } from "../../utils/data";
import PlotlyChart from "../../components/PlotlyChart";
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";
import { PlotlyChartInstance, defaultPlotlyInstanceState } from "../../components/reducers/PlotlyChartReducer";
import { getDimensions, parseStyle } from "../../utils/style";
import "../../ui/Charts.scss";

import { Config, Layout } from "plotly.js";
import { DefaultReduxStore } from "../../store";

// TODO improve typing by replace explicit any types

export interface AnyChartComponentProps extends AnyChartDataHandlerProps {
    alertMessage?: ReactChild;
    onClick?: (data: any) => void;
    onHover?: (data: any, node: HTMLDivElement) => void;
}
export type AnyChartProps = AnyChartComponentProps & typeof PlotlyChartActions & PlotlyChartInstance;

class AnyChart extends Component<AnyChartProps> {
    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: `widget-charts-any-alert` }, this.props.alertMessage);
        }

        return this.renderChart();
    }

    private renderChart() {
        return createElement(PlotlyChart, {
            data: this.getData(this.props),
            loadingAPI: this.props.loadingAPI,
            loadingData: this.props.fetchingData,
            layout: this.getLayoutOptions(this.props),
            config: this.getConfigOptions(this.props),
            plotly: this.props.plotly,
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

const mapStateToProps: MapStateToProps<PlotlyChartInstance, AnyChartComponentProps, DefaultReduxStore> = (state, props) =>
    state.plotly[props.friendlyId] || defaultPlotlyInstanceState;
const mapDispatchToProps: MapDispatchToProps<typeof PlotlyChartActions, AnyChartComponentProps> =
    dispatch => bindActionCreators(PlotlyChartActions, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(AnyChart);
