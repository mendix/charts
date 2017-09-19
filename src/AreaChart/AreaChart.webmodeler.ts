import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { LineChart } from "../LineChart/components/LineChart";
import { LineChartContainerProps } from "../LineChart/components/LineChartContainer";

import { validateSeriesProps } from "../utils/data";
import { parseStyle } from "../utils/style";

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                className: "widget-charts-line-alert",
                message: validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions)
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
                data: [ {
                    connectgaps: true,
                    mode: "lines+markers",
                    name: "Sample",
                    type: "scatter",
                    x: [ 14, 20, 30, 50 ],
                    y: [ 14, 30, 20, 40 ],
                    fill: this.props.fill ? "tonexty" : "none"
                } ] as Plotly.ScatterData[],
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
