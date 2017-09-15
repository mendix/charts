import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { validateSeriesProps } from "../utils/data";
import { LineChart } from "./components/LineChart";
import { LineChartContainerProps } from "./components/LineChartContainer";
import { parseStyle } from "../utils/style";

import * as dataSchema from "./data.schema.json";
import * as layoutSchema from "./layout.schema.json";

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                className: "widget-charts-line-alert",
                message: validateSeriesProps(this.props.series, this.props.friendlyId, {
                    dataSchema,
                    layoutOptions: this.props.layoutOptions,
                    layoutSchema
                })
            }),
            createElement(LineChart, {
                className: this.props.class,
                config: { displayModeBar: this.props.showToolBar, doubleClick: false },
                layout: {
                    autosize: true,
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
