import { Component, createElement } from "react";
import { Provider } from "react-redux";
import deepMerge from "deepmerge";
import { store } from "../store";
import "../LineChart/store/LineChartReducer"; // ==important==: without this, the reducer shall not be registered.

import LineChart from "../LineChart/components/LineChart";

import { getInstanceID, getRandomNumbers, validateSeriesProps } from "../utils/data";
import { LineChartDataHandlerProps } from "../LineChart/components/LineChartDataHandler";
import { Container } from "../utils/namespaces";
import { ScatterData } from "plotly.js";
import { defaultColours, fillColours } from "../utils/style";
import LineChartContainerProps = Container.LineChartContainerProps;

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, { updatingData: boolean }> {
    readonly state = { updatingData: true };
    private instanceID = this.props.uniqueid || getInstanceID(this.props.friendlyId, store, "scatter");
    private scatterData = this.getData(this.props);

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
                instanceID: this.instanceID,
                fill: false,
                scatterData: this.scatterData,
                themeConfigs: { layout: {}, configuration: {}, data: {} }
            })
        );
    }

    componentWillReceiveProps() {
        this.setState({ updatingData: true });
    }

    private toggleUpdatingData = (_widgetID: string, updatingData: boolean): any => {
        this.setState({ updatingData });
    }

    private getData(props: LineChartContainerProps): ScatterData[] {
        if (props.series.length) {
            return props.series.map((series, index) => {
                const sampleData = preview.getSampleTraces();

                return deepMerge.all([ {
                    connectgaps: true,
                    hoveron: "points",
                    hoverinfo: "none" as any,
                    line: {
                        color: series.lineColor || defaultColours()[index],
                        shape: series.lineStyle
                    },
                    marker: {  color: series.lineColor || defaultColours()[index] },
                    mode: series.mode ? series.mode.replace("X", "+") as Container.LineMode : "lines",
                    name: series.name,
                    type: "scatter",
                    fill: series.fill ? "tonexty" : "none",
                    fillcolor: series.fillColor || fillColours[index],
                    series: {},
                    x: sampleData.x || [],
                    y: sampleData.y || []
                } as ScatterData ]);
            });
        }

        return [ {
            connectgaps: true,
            hoveron: "points",
            hoverinfo: "none" as any,
            name: "Sample",
            type: "scatter",
            fill: "tonexty",
            fillcolor: fillColours[0],
            line: { color: defaultColours()[0] },
            marker: {  color: defaultColours()[0] },
            series: {},
            ...preview.getSampleTraces()
        } as ScatterData ];
    }

    private static getSampleTraces(): { x: (string | number)[], y: (string | number)[] } {
        return {
            x: [ "2017-10-04 22:23:00", "2017-11-04 22:23:00", "2017-12-04 22:23:00" ],
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
            if (series.dataSourceType === "XPath") {
                visibilityMap.series[index].dataSourceMicroflow = false;
            } else if (series.dataSourceType === "microflow") {
                visibilityMap.series[index].entityConstraint = false;
                visibilityMap.series[index].xValueSortAttribute = false;
            }
            visibilityMap.series[index].seriesOptions = false;
            visibilityMap.series[index].onClickMicroflow = series.onClickEvent === "callMicroflow";
            visibilityMap.series[index].onClickNanoflow = series.onClickEvent === "callNanoflow";
            visibilityMap.series[index].onClickPage = series.onClickEvent === "showPage";

            visibilityMap.series[index].openPageLocation = series.onClickEvent === "showPage";
        });
    }
    visibilityMap.layoutOptions = false;
    visibilityMap.devMode = false;

    return visibilityMap;
}
