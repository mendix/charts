import { Component, createElement } from "react";
import { Provider } from "react-redux";
import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";
import { store } from "../store";
import "./store/LineChartReducer"; // ==important==: without this, the reducer shall not be registered.

import LineChart from "./components/LineChart";

import { getInstanceID, getRandomNumbers, validateSeriesProps } from "../utils/data";
import { Container } from "../utils/namespaces";
import { LineChartDataHandlerProps } from "./components/LineChartDataHandler";
import { defaultColours } from "../utils/style";
import LineMode = Container.LineMode;
import LineChartContainerProps = Container.LineChartContainerProps;

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, { updatingData: boolean }> {
    state = { updatingData: true };
    private instanceID = getInstanceID(this.props.friendlyId, store, "scatter");

    render() {
        const alertMessage = validateSeriesProps(
            this.props.series,
            this.props.friendlyId,
            this.props.layoutOptions,
            this.props.configurationOptions
        );

        return createElement(Provider, { store },
            createElement(LineChart, {
                ...this.props as LineChartDataHandlerProps,
                alertMessage,
                devMode: this.props.devMode === "developer" ? "advanced" : this.props.devMode,
                fetchingData: false,
                updatingData: this.state.updatingData,
                toggleUpdatingData: this.toggleUpdatingData,
                scatterData: preview.getData(this.props),
                themeConfigs: { layout: {}, configuration: {}, data: {} },
                instanceID: this.instanceID
            })
        );
    }

    componentWillReceiveProps() {
        this.setState({ updatingData: true });
    }

    private toggleUpdatingData = (_widgetID: string, updatingData: boolean): any => {
        this.setState({ updatingData });
    }

    static getData(props: LineChartContainerProps): ScatterData[] {
        if (props.series.length) {
            return props.series.map((series, index) => {
                const sampleData = preview.getSampleTraces();
                const color = series.lineColor || defaultColours()[index];

                return deepMerge.all([ {
                    connectgaps: true,
                    hoverinfo: "none" as any,
                    line: {
                        color,
                        shape: series.lineStyle
                    },
                    mode: series.mode ? series.mode.replace("X", "+") as LineMode : "lines",
                    name: series.name,
                    type: "scatter",
                    fill: "none",
                    x: sampleData.x || [],
                    y: sampleData.y || [],
                    series: {},
                    marker: { color }
                } as ScatterData ]);
            });
        }

        return [ {
            connectgaps: true,
            hoveron: "points",
            hoverinfo: "none",
            name: "Sample",
            type: "scatter",
            series: {},
            line: { color: defaultColours()[0] },
            marker: {  color: defaultColours()[0] },
            ...preview.getSampleTraces()
        } as any ];
    }

    private static getSampleTraces(): { x: (string | number)[], y: (string | number)[] } {
        return {
            x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ],
            y: getRandomNumbers(4, 100)
        };
    }
}

export function getPreviewCss() {
    return (
        require("../ui/Charts.scss") +
        require("../ui/ChartsLoading.scss") +
        require("plotly.js/src/css/style.scss")
    );
}

export function getVisibleProperties(valueMap: LineChartContainerProps, visibilityMap: VisibilityMap<LineChartContainerProps>) { // tslint:disable-line max-line-length
    if (valueMap.series && Array.isArray(valueMap.series)) {
        valueMap.series.forEach((series, index) => {
            if (series.dataSourceType !== "XPath") {
                visibilityMap.series[index].entityConstraint = false;
            }
            if (series.dataSourceType !== "microflow") {
                visibilityMap.series[index].dataSourceMicroflow = false;
            }
            if (series.dataSourceType !== "REST") {
                visibilityMap.series[index].restUrl = false;
            }
            visibilityMap.series[index].seriesOptions = false;
            visibilityMap.series[index].onClickMicroflow = series.onClickEvent === "callMicroflow";
            visibilityMap.series[index].onClickNanoflow = series.onClickEvent === "callNanoflow";
            visibilityMap.series[index].onClickPage = series.onClickEvent === "showPage";

            visibilityMap.series[index].openPageLocation = series.onClickEvent === "showPage";
        });
    }
    visibilityMap.devMode = false;
    visibilityMap.layoutOptions = false;

    return visibilityMap;
}
