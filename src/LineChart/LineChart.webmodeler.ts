import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { validateSeriesProps } from "../utils/data";
import deepMerge from "deepmerge";
import { LineChart, Mode } from "./components/LineChart";
import { LineChartContainerProps } from "./components/LineChartContainer";
import { ScatterData } from "plotly.js";

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                className: "widget-charts-line-alert",
                message: validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions)
            }),
            createElement(LineChart, {
                ...this.props,
                defaultData: this.getData(this.props)
            })
        );
    }

    private getData(props: LineChartContainerProps): ScatterData[] {
        if (props.series) {
            return props.series.map(series => {
                const seriesOptions = series.seriesOptions.trim() ? JSON.parse(series.seriesOptions) : {};
                const sampleData = series.sampleData.trim() ? JSON.parse(series.sampleData.trim()) : {};

                return deepMerge.all([ seriesOptions, {
                    connectgaps: true,
                    hoveron: "points",
                    line: {
                        color: series.lineColor,
                        shape: series.lineStyle
                    },
                    mode: series.mode.replace("X", "+") as Mode,
                    name: series.name,
                    type: "scatter",
                    fill: "none",
                    x: sampleData.x || [],
                    y: sampleData.y || []
                } ]);
            });
        }

        return [ {
            connectgaps: true,
            hoveron: "points",
            name: "Sample",
            type: "scatter",
            x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ],
            y: [ 14, 30, 20, 40 ]
        } as ScatterData ];
    }
}

export function getPreviewCss() {
    return require("plotly.js/src/css/style.scss");
}
