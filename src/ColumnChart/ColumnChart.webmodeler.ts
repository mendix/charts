import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { BarChart } from "../BarChart/components/BarChart";
import { BarChartContainerProps } from "../BarChart/components/BarChartContainer";
import { validateSeriesProps } from "../utils/data";
import { ScatterData } from "plotly.js";

// tslint:disable-next-line class-name
export class preview extends Component<BarChartContainerProps, {}> {
    private data: Partial<ScatterData>[] = [
        {
            type: "bar",
            [`${this.props.orientation === "bar" ? "y" : "x"}`]: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ],
            [`${this.props.orientation === "bar" ? "x" : "y"}`]: [ 20, 14, 23, 25 ],
            orientation: this.props.orientation === "bar" ? "h" : "v",
            name: "Sample"
        }
    ];

    render() {
        return createElement("div", {},
            createElement(Alert, {
                className: "widget-charts-column-alert",
                message: validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions)
            }),
            createElement(BarChart, {
                ...this.props,
                defaultData: this.data as ScatterData[]
            })
        );
    }
}

export function getPreviewCss() {
    return (require("plotly.js/src/css/style.scss"));
}
