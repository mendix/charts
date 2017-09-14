import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { BarChart } from "./components/BarChart";
import { BarChartContainerProps } from "./components/BarChartContainer";
import { validateSeriesProps } from "../utils/data";
import { parseStyle } from "../utils/style";

// tslint:disable-next-line class-name
export class preview extends Component<BarChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                className: "widget-charts-bar-alert",
                message: validateSeriesProps(this.props.series, this.props.friendlyId)
            }),
            createElement(BarChart, {
                className: this.props.class,
                config: { displayModeBar: this.props.showToolbar, doubleClick: false },
                height: this.props.height,
                heightUnit: this.props.heightUnit,
                layout: {
                    autosize: true,
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
