import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { PieChart } from "./components/PieChart";
import PieChartContainer, { PieChartContainerProps, PieData } from "./components/PieChartContainer";

// tslint:disable-next-line class-name
export class preview extends Component<PieChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: `widget-${this.props.chartType}-chart-alert`,
                message: PieChartContainer.validateProps(this.props)
            }),
            createElement(PieChart, PieChartContainer.getPieChartProps(this.props, this.getDefaultData()))
        );
    }

    private getDefaultData(): PieData {
        return {
            labels: [ "Apples", "Mangoes", "Jackfruit", "Oranges" ],
            values: [ 16, 15, 12, 42 ]
        };
    }
}

export function getPreviewCss() {
    return require("plotly.js/src/css/style.scss");
}

export function getVisibleProperties(valueMap: PieChartContainerProps, visibilityMap: VisibilityMap<PieChartContainerProps>) { // tslint:disable-line max-line-length
    if (valueMap.dataSourceType === "XPath") {
        visibilityMap.entityConstraint = true;
        visibilityMap.dataSourceMicroflow = false;
    } else if (valueMap.dataSourceType === "microflow") {
        visibilityMap.entityConstraint = false;
        visibilityMap.dataSourceMicroflow = true;
    }

    return visibilityMap;
}
