import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { LineChart } from "../LineChart/components/LineChart";

import { getRandomNumbers, validateSeriesProps } from "../utils/data";
import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";
import { Container } from "../utils/namespaces";
import LineChartContainerProps = Container.LineChartContainerProps;
import LineMode = Container.LineMode;

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, { className: "widget-charts-polar-alert" },
                validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions)
            ),
            createElement(LineChart, {
                ...this.props as LineChartContainerProps,
                scatterData: preview.getData(this.props),
                type: "polar"
            })
        );
    }

    static getData(props: LineChartContainerProps): ScatterData[] {
        if (props.series.length) {
            return props.series.map(series => {
                const seriesOptions = props.devMode !== "basic" && series.seriesOptions.trim()
                    ? JSON.parse(series.seriesOptions)
                    : {};
                const sampleData = preview.getSampleTraces();

                return deepMerge.all([ {
                    connectgaps: true,
                    hoverinfo: "none",
                    line: {
                        color: series.lineColor,
                        shape: series.lineStyle
                    },
                    mode: series.mode ? series.mode.replace("X", "+") as LineMode : "lines",
                    name: series.name,
                    type: "scatterpolar",
                    fill: "toself",
                    r: sampleData.r || [],
                    theta: sampleData.theta || [],
                    series: {}
                }, seriesOptions ]);
            });
        }

        return [ {
            name: "Sample",
            type: "scatterpolar",
            series: {},
            fill: "toself",
            ...preview.getSampleTraces()
        } as any ];
    }

    private static getSampleTraces(): { r: (string | number)[], theta: (string | number)[] } {
        return {
            r: [ 39, 28, 8, 7, 28, 39 ],
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
            if (series.onClickEvent === "doNothing") {
                visibilityMap.series[index].onClickPage = visibilityMap.series[index].onClickMicroflow = false;
            } else if (series.onClickEvent === "callMicroflow") {
                visibilityMap.series[index].onClickPage = false;
            } else if (series.onClickEvent === "showPage") {
                visibilityMap.series[index].onClickMicroflow = false;
            }
        });
    }
    visibilityMap.devMode = false;
    visibilityMap.layoutOptions = false;

    return visibilityMap;
}
