import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { BarChart } from "./components/BarChart";

import { getRandomNumbers, validateSeriesProps } from "../utils/data";
import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";
import { Container } from "../utils/namespaces";
import BarChartContainerProps = Container.BarChartContainerProps;
import { defaultColours } from "../utils/style";

// tslint:disable-next-line class-name
export class preview extends Component<BarChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, { className: "widget-charts-bar-alert" },
                validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions)
            ),
            createElement(BarChart, {
                ...this.props as BarChartContainerProps,
                devMode: this.props.devMode === "developer" ? "advanced" : this.props.devMode,
                orientation: "bar",
                scatterData: preview.getData(this.props)
            })
        );
    }

    static getData(props: BarChartContainerProps): ScatterData[] {
        if (props.series.length) {
            return props.series.map((series, index) => {
                const seriesOptions = props.devMode !== "basic" && series.seriesOptions.trim()
                    ? JSON.parse(series.seriesOptions)
                    : {};
                const sampleData = preview.getSampleTraces();

                return deepMerge.all([ {
                    name: series.name,
                    type: "bar",
                    orientation: "h",
                    hoverinfo: "none",
                    x: sampleData.x || [],
                    y: sampleData.y || [],
                    series: {},
                    marker: {  color: series.barColor || defaultColours()[index] }
                }, seriesOptions ]);
            });
        }

        return [ {
                type: "bar",
                orientation: "h",
                name: "Sample",
                hoverinfo: "none" as any,
                series: {},
                marker: {  color: defaultColours()[0] },
                ...preview.getSampleTraces()
            } ] as ScatterData[];
    }

    static getSampleTraces(): { x: (string | number)[], y: (string | number)[] } {
        return {
            x: getRandomNumbers(4, 100),
            y: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ]
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

export function getVisibleProperties(valueMap: BarChartContainerProps, visibilityMap: VisibilityMap<BarChartContainerProps>) { // tslint:disable-line max-line-length
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
            if (series.onClickEvent === "doNothing") {
                visibilityMap.series[index].onClickPage = visibilityMap.series[index].onClickMicroflow = false;
            } else if (series.onClickEvent === "callMicroflow") {
                visibilityMap.series[index].onClickPage = false;
            } else if (series.onClickEvent === "showPage") {
                visibilityMap.series[index].onClickMicroflow = false;
            }
        });
    }
    visibilityMap.layoutOptions = false;
    visibilityMap.devMode = false;

    return visibilityMap;
}
