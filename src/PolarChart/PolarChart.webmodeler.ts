import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { LineChart } from "../LineChart/components/LineChart";

import { getRandomNumbers, validateSeriesProps } from "../utils/data";
import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";
import { Container } from "../utils/namespaces";
import LineChartContainerProps = Container.LineChartContainerProps;
import LineMode = Container.LineMode;
import { defaultColours, fillColours } from "../utils/style";

// tslint:disable-next-line class-name
export class preview extends Component<Container.PolarChartContainerProps, {}> {
    render() {
        const validationAlert = validateSeriesProps(
            this.props.series,
            this.props.friendlyId,
            this.props.layoutOptions,
            this.props.configurationOptions
        );

        if (validationAlert) {
            return createElement(Alert, {}, validationAlert);
        }

        return createElement(LineChart, {
            ...this.props as LineChartContainerProps,
            devMode: this.props.devMode === "developer" ? "advanced" : this.props.devMode,
            scatterData: preview.getData(this.props),
            type: "polar",
            themeConfigs: { layout: {}, configuration: {}, data: {} },
            polar: {
                radialaxis: {
                    rangemode: this.props.rangeMode,
                    showgrid: this.props.showGrid,
                    gridcolor: "#d7d7d7",
                    tickcolor: "#d7d7d7"
                },
                angularaxis: {
                    linecolor: "#d7d7d7",
                    tickcolor: "#d7d7d7"
                }
            }
        });
    }

    static getData(props: LineChartContainerProps): ScatterData[] {
        if (props.series.length) {
            return props.series.map((series, index) => {
                const seriesOptions = props.devMode !== "basic" && series.seriesOptions.trim()
                    ? JSON.parse(series.seriesOptions)
                    : {};
                const color = series.lineColor || defaultColours()[index];

                return deepMerge.all([ {
                    connectgaps: true,
                    hoveron: "points",
                    hoverinfo: "none",
                    line: {
                        color,
                        shape: series.lineStyle
                    },
                    mode: series.mode ? series.mode.replace("X", "+") as LineMode : "lines",
                    name: series.name,
                    type: "scatterpolar",
                    fill: "toself",
                    fillcolor: series.fillColor || fillColours[index],
                    series: {},
                    marker: { color },
                    ...preview.getSampleTraces()
                }, seriesOptions ]);
            });
        }

        return [ {
            name: "Sample",
            type: "scatterpolar",
            hoveron: "points",
            hoverinfo: "none",
            series: {},
            fill: "toself",
            fillcolor: fillColours[0],
            line: { color: defaultColours()[0] },
            marker: {  color: defaultColours()[0] },
            ...preview.getSampleTraces()
        } as any ];
    }

    private static getSampleTraces(): { r: (string | number)[], theta: (string | number)[] } {
        const randomNumbers = getRandomNumbers(6, 100);

        return {
            r: randomNumbers.concat(randomNumbers[0]),
            theta: [ "A", "B", "C", "D", "E", "A" ]
        };
    }
}

export function getPreviewCss() {
    return (
        require("../ui/Charts.scss") +
        require("../ui/ChartsLoading.scss") +
        require("../ui/Sidebar.scss") +
        require("../ui/Playground.scss") +
        require("../ui/Panel.scss") +
        require("../ui/InfoTooltip.scss") +
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
