import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { BarChart } from "./components/BarChart";
import { BarChartContainerProps } from "./components/BarChartContainer";

import { getRandomNumbers, validateSeriesProps } from "../utils/data";
import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";

// tslint:disable-next-line class-name
export class preview extends Component<BarChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, { className: "widget-charts-bar-alert" },
                validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions)
            ),
            createElement(BarChart, {
                ...this.props as BarChartContainerProps,
                defaultData: preview.getData(this.props)
            })
        );
    }

    static getData(props: BarChartContainerProps): ScatterData[] {
        if (props.series) {
            return props.series.map(series => {
                const seriesOptions = series.seriesOptions.trim() ? JSON.parse(series.seriesOptions) : {};
                const sampleData = preview.getSampleTraces();

                return deepMerge.all([ {
                    name: series.name,
                    type: "bar",
                    orientation: "h",
                    x: sampleData.x || [],
                    y: sampleData.y || []
                }, seriesOptions ]);
            });
        }

        return [
            {
                type: "bar",
                orientation: "h",
                name: "Sample",
                ...preview.getSampleTraces()
            } as ScatterData
        ];
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
        require("../ui/Sidebar.scss") +
        require("../ui/Playground.scss") +
        require("../ui/Panel.scss") +
        require("../ui/InfoTooltip.scss") +
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
            }
            visibilityMap.series[index].seriesOptions = false;
        });
    }
    visibilityMap.layoutOptions = false;
    visibilityMap.devMode = false;

    return visibilityMap;
}
