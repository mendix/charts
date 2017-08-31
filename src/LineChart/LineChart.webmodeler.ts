import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { LineChart } from "./components/LineChart";
import LineChartContainer, { LineChartContainerProps } from "./components/LineChartContainer";
import { parseStyle } from "../utils/style";

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-charts-line-alert",
                message: LineChartContainer.validateProps(this.props)
            }),
            createElement(LineChart, {
                className: this.props.class,
                config: { displayModeBar: this.props.showToolBar, doubleClick: false },
                layout: {
                    autosize: this.props.responsive,
                    hovermode: this.props.tooltipForm ? "closest" : undefined,
                    showlegend: this.props.showLegend,
                    xaxis: { showgrid: this.props.showGrid, title: this.props.xAxisLabel },
                    yaxis: { showgrid: this.props.showGrid, title: this.props.yAxisLabel }
                },
                style: parseStyle(this.props.style),
                width: this.props.width,
                height: this.props.height,
                widthUnit: this.props.widthUnit,
                heightUnit: this.props.heightUnit
            })
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
