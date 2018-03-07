import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { BubbleChart } from "./components/BubbleChart";

import { getRandomNumbers, validateSeriesProps } from "../utils/data";
import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";
import { Container } from "../utils/namespaces";
import BubbleChartContainerProps = Container.BubbleChartContainerProps;

// tslint:disable-next-line class-name
export class preview extends Component<BubbleChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, { className: "widget-charts-line-alert" },
                validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions)
            ),
            createElement(BubbleChart, {
                ...this.props as BubbleChartContainerProps,
                scatterData: preview.getData(this.props)
            })
        );
    }

    static getData(props: BubbleChartContainerProps): ScatterData[] {
        if (props.series.length) {
            return props.series.map(series => {
                const seriesOptions = props.devMode !== "basic" && series.seriesOptions.trim()
                    ? JSON.parse(series.seriesOptions)
                    : {};
                const sampleData = preview.getSampleTraces();

                return deepMerge.all([ {
                    connectgaps: true,
                    hoveron: "points",
                    markers: {
                        color: series.color,
                        size: sampleData.size
                    },
                    mode: "markers",
                    name: series.name,
                    type: "scatter",
                    x: sampleData.x || [],
                    y: sampleData.y || [],
                    size: sampleData.size

                }, seriesOptions ]);
            });
        }
        const defaultData = preview.getSampleTraces();

        return [ {
            connectgaps: true,
            hoveron: "points",
            name: "Sample",
            type: "scatter",
            mode: "markers",
            x: defaultData.x,
            y: defaultData.y,
            marker: {
                size: defaultData.size
            },
            text: defaultData.size
        } as ScatterData ];
    }

    private static getSampleTraces(): { x: (string | number)[], y: (string | number)[], size: (string | number)[] } {
        return {
            x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ],
            y: getRandomNumbers(4, 100),
            size: getRandomNumbers(4, 100, 20)
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

export function getVisibleProperties(valueMap: BubbleChartContainerProps, visibilityMap: VisibilityMap<BubbleChartContainerProps>) { // tslint:disable-line max-line-length
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
