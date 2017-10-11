import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { BarChart } from "../BarChart/components/BarChart";
import { BarChartContainerProps } from "../BarChart/components/BarChartContainer";

import { validateSeriesProps } from "../utils/data";
import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";

// tslint:disable-next-line class-name
export class preview extends Component<BarChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                className: "widget-charts-column-alert",
                message: validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions)
            }),
            createElement(BarChart, {
                ...this.props,
                defaultData: this.getData(this.props)
            })
        );
    }

    private getData(props: BarChartContainerProps): ScatterData[] {
        if (props.series) {
            return props.series.map(series => {
                const seriesOptions = series.seriesOptions.trim() ? JSON.parse(series.seriesOptions) : {};
                const sampleData = series.sampleData && series.sampleData.trim()
                    ? JSON.parse(series.sampleData.trim())
                    : {};

                return deepMerge.all([ seriesOptions, {
                    name: series.name,
                    type: "bar",
                    orientation: "v",
                    x: sampleData.x || [],
                    y: sampleData.y || []
                } ]);
            });
        }

        return [
            {
                type: "bar",
                x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ],
                y: [ 20, 14, 23, 25 ],
                orientation: "v",
                name: "Sample"
            } as ScatterData
        ];
    }
}

export function getPreviewCss() {
    return (require("plotly.js/src/css/style.scss"));
}
