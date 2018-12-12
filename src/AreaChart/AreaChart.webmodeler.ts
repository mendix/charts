import { Component, createElement } from "react";
import { Provider } from "react-redux";
import deepMerge from "deepmerge";
import { store } from "../store";
import "../LineChart/store/LineChartReducer"; // ==important==: without this, the reducer shall not be registered.

import LineChart from "../LineChart/components/LineChart";

import { getInstanceID, getRandomNumbers, validateSeriesProps } from "../utils/data";
import { Container } from "../utils/namespaces";
import { ScatterData } from "plotly.js";
import { defaultColours, fillColours } from "../utils/style";
import { LineChartDataHandlerProps } from "../LineChart/components/LineChartDataHandler";
import LineChartContainerProps = Container.LineChartContainerProps;

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, { updatingData: boolean }> {
    readonly state = { updatingData: true };
    private instanceID = this.props.uniqueid || getInstanceID(this.props.friendlyId, store, "scatter");
    private sampleData: Container.SampleTrace[] = [];
    private firstTrace = preview.getSampleTraces();

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
                fill: true,
                scatterData: this.getData(this.props),
                themeConfigs: { layout: {}, configuration: {}, data: {} },
                instanceID: this.instanceID
            })
        );
    }

    componentWillReceiveProps() {
        this.setState({ updatingData: true });
    }

    updateTraces(props: LineChartContainerProps): Container.SampleTrace[] {
        const sampleData: Container.SampleTrace[] = [];
        if (!this.props.series.length) {
            return [ {
                seriesName: "Sample-0",
                trace: this.firstTrace
            } ];
        } else if (props.series.length !== this.sampleData.length) {
            props.series.forEach((series, index) => {
                const filtered = this.sampleData.filter(sample => sample.seriesName === series.name);
                if (!filtered.length) {
                    sampleData.push({
                        seriesName: series.name,
                        trace: index ? preview.getSampleTraces() : this.firstTrace
                    });
                } else {
                    sampleData.push(filtered[0]);
                }
            });

            return sampleData;
        }

        return this.sampleData;
    }

    private toggleUpdatingData = (_widgetID: string, updatingData: boolean): any => {
        this.setState({ updatingData });
    }

    private getData(props: LineChartContainerProps): ScatterData[] {
        this.sampleData = this.updateTraces(props);
        if (props.series.length) {
            return props.series.map((series, index) => {
                const { trace } = this.sampleData.filter(sample => sample.seriesName === series.name)[0];

                return deepMerge.all([ {
                    connectgaps: true,
                    hoveron: "points",
                    hoverinfo: "none" as any,
                    line: {
                        color: series.lineColor || defaultColours()[index],
                        shape: series.lineStyle
                    },
                    mode: series.mode ? series.mode.replace("X", "+") as Container.LineMode : "lines",
                    name: series.name,
                    type: "scatter",
                    fill: "tonexty",
                    fillcolor: series.fillColor || fillColours[index],
                    x: trace.x || [],
                    y: trace.y || [],
                    marker: {  color: series.lineColor || defaultColours()[index] },
                    series: {}
                } as ScatterData ]);
            });
        }

        return [ {
            connectgaps: true,
            hoveron: "points",
            hoverinfo: "none",
            name: "Sample",
            type: "scatter",
            fill: "tonexty",
            fillcolor: fillColours[0],
            series: {},
            marker: {  color: defaultColours()[0] },
            ...this.firstTrace
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
            if (series.dataSourceType === "XPath") {
                visibilityMap.series[index].dataSourceMicroflow = false;
            } else if (series.dataSourceType === "microflow") {
                visibilityMap.series[index].entityConstraint = false;
                visibilityMap.series[index].xValueSortAttribute = false;
                visibilityMap.series[index].sortOrder = false;
            }
            visibilityMap.series[index].seriesOptions = false;

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
