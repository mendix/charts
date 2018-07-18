import { Component, createElement } from "react";
import { Provider } from "react-redux";
import deepMerge from "deepmerge";
import { store } from "../store";
import "../LineChart/store/LineChartReducer"; // ==important==: without this, the reducer shall not be registered.

import LineChart from "../LineChart/components/LineChart";

import { getInstanceID, getRandomNumbers, validateSeriesProps } from "../utils/data";
import { Container, Data } from "../utils/namespaces";
import { LineChartDataHandlerProps } from "../LineChart/components/LineChartDataHandler";
import { ScatterData } from "plotly.js";
import { defaultColours } from "../utils/style";
import LineChartContainerProps = Container.LineChartContainerProps;

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, { updatingData: boolean }> {
    readonly state = { updatingData: true };
    private instanceID = getInstanceID(this.props.friendlyId, store, "scatter");
    private scatterData = preview.getData(this.props);

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
                type: "bubble",
                devMode: this.props.devMode === "developer" ? "advanced" : this.props.devMode,
                fetchingData: false,
                updatingData: this.state.updatingData,
                toggleUpdatingData: this.toggleUpdatingData,
                instanceID: this.instanceID,
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

    static getData(props: LineChartContainerProps): ScatterData[] {
        let sampleData = preview.getSampleTraces();
        if (props.series.length) {
            return props.series.map((series, index) => {
                sampleData = preview.getSampleTraces();

                return deepMerge.all([
                    {
                        connectgaps: true,
                        hoverinfo: "none" as any,
                        hoveron: "points",
                        mode: "markers",
                        name: series.name,
                        type: "scatter",
                        series: {},
                        text: sampleData.marker ? sampleData.marker.size : "",
                        marker: {
                            color: series.color || defaultColours(0.7)[index],
                            line: { width: 0 }
                        }

                    } as ScatterData,
                    sampleData
                ]);
            });
        }

        return [
            deepMerge.all(
                [
                    {
                        connectgaps: true,
                        hoverinfo: "none",
                        hoveron: "points",
                        name: "Sample",
                        type: "scatter",
                        mode: "markers",
                        text: sampleData.marker ? sampleData.marker.size : "",
                        series: {},
                        marker: {
                            color: defaultColours(0.7)[0],
                            line: { width: 0 }
                        }
                    } as any,
                    sampleData
                ]
            )
        ];
    }

    private static getSampleTraces(): Data.ScatterTrace {
        return {
            x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ],
            y: getRandomNumbers(4, 100),
            marker: { size: getRandomNumbers(4, 100, 20) }
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
