import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { validateSeriesProps } from "../utils/data";
import { LineChart } from "./components/LineChart";
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
                defaultData: [ {
                    x: [ 14, 20, 30, 50 ],
                    y: [ 14, 30, 20, 40 ]
                } as ScatterData ]
            })
        );
    }
}

export function getPreviewCss() {
    return require("plotly.js/src/css/style.scss");
}
