import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { LineChart } from "./components/LineChart";
import LineChartContainer, { LineChartContainerProps } from "./components/LineChartContainer";

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-charts-line-alert",
                message: LineChartContainer.validateProps(this.props)
            }),
            createElement(LineChart, LineChartContainer.getLineChartProps(this.props))
        );
    }
}

export function getPreviewCss() {
    return require("plotly.js/src/css/style.scss");
}

export function getVisibleProperties(valueMap: LineChartContainerProps, visibilityMap: VisibilityMap<LineChartContainerProps>) { // tslint:disable-line max-line-length
    if (valueMap.dataSourceType === "XPath") {
        visibilityMap.entityConstraint = true;
        visibilityMap.dataSourceMicroflow = false;
    } else if (valueMap.dataSourceType === "microflow") {
        visibilityMap.entityConstraint = false;
        visibilityMap.dataSourceMicroflow = true;
    }

    return visibilityMap;
}
