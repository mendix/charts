import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { BarChart } from "./components/BarChart";
import BarChartContainer, { BarChartContainerProps } from "./components/BarChartContainer";
import { parseStyle } from "../utils/style";

// tslint:disable-next-line class-name
export class preview extends Component<BarChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-charts-bar-alert",
                message: BarChartContainer.validateProps(this.props)
            }),
            createElement(BarChart, {
                className: this.props.class,
                config: { displayModeBar: this.props.showToolbar, doubleClick: false },
                height: this.props.height,
                heightUnit: this.props.heightUnit,
                layout: {
                    autosize: this.props.responsive,
                    barmode: this.props.barMode,
                    xaxis: { showgrid: this.props.showGrid, title: this.props.xAxisLabel },
                    yaxis: { showgrid: this.props.showGrid, title: this.props.yAxisLabel },
                    showlegend: this.props.showLegend
                },
                style: parseStyle(this.props.style),
                width: this.props.width,
                widthUnit: this.props.widthUnit
            })
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
