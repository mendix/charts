import { Component, createElement } from "react";

import { LineChart } from "../LineChart/components/LineChart";

import { getRandomNumbers, validateSeriesProps } from "../utils/data";
import deepMerge from "deepmerge";
import { Container } from "../utils/namespaces";
import { ScatterData } from "plotly.js";
import LineChartContainerProps = Container.LineChartContainerProps;
import { defaultColours, fillColours } from "../utils/style";

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, {}> {
    render() {
        const alertMessage = validateSeriesProps(
            this.props.series,
            this.props.friendlyId,
            this.props.layoutOptions,
            this.props.configurationOptions
        );

        return createElement(LineChart, {
            ...this.props as LineChartContainerProps,
            alertMessage,
            devMode: this.props.devMode === "developer" ? "advanced" : this.props.devMode,
            fill: true,
            scatterData: this.getData(this.props),
            themeConfigs: { layout: {}, configuration: {}, data: {} }
        });
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
                    mode: series.mode ? series.mode.replace("X", "+") as Container.LineMode : "lines",
                    name: series.name,
                    type: "scatter",
                    fill: "tonexty",
                    fillcolor: series.fillColor || fillColours[index],
                    x: sampleData.x || [],
                    y: sampleData.y || [],
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
