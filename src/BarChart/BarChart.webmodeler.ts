import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { BarChart } from "./components/BarChart";
import BarChartContainer, { BarChartContainerProps } from "./components/BarChartContainer";

// tslint:disable-next-line class-name
export class preview extends Component<BarChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-charts-bar-alert",
                message: BarChartContainer.validateProps(this.props)
            }),
            createElement(BarChart, BarChartContainer.getBarChartProps(this.props))
        );
    }
}

export function getPreviewCss() {
    return (require("plotly.js/src/css/style.scss"));
}

export function getVisibleProperties(valueMap: BarChartContainerProps, visibilityMap: VisibilityMap<BarChartContainerProps>) { // tslint:disable-line max-line-length
    if (valueMap.dataSourceType === "XPath") {
        visibilityMap.entityConstraint = true;
        visibilityMap.dataSourceMicroflow = false;
    } else if (valueMap.dataSourceType === "microflow") {
        visibilityMap.entityConstraint = false;
        visibilityMap.dataSourceMicroflow = true;
    }

    return visibilityMap;
}
