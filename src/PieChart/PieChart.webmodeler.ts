import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { PieChart } from "./components/PieChart";
import PieChartContainer, { PieChartContainerProps } from "./components/PieChartContainer";
import { parseStyle } from "../utils/style";

// tslint:disable-next-line class-name
export class preview extends Component<PieChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: `widget-${this.props.chartType}-chart-alert`,
                message: PieChartContainer.validateProps(this.props)
            }),
            createElement(PieChart, {
                className: this.props.class,
                config: { displayModeBar: this.props.showToolBar },
                height: this.props.height,
                heightUnit: this.props.heightUnit,
                layout: {
                    autosize: true,
                    showlegend: this.props.showLegend
                },
                style: parseStyle(this.props.style),
                type: this.props.chartType,
                width: this.props.width,
                widthUnit: this.props.widthUnit
            })
        );
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
