import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { PieChart } from "./components/PieChart";
import PieChartContainer, { PieChartContainerProps } from "./components/PieChartContainer";

import deepMerge from "deepmerge";
import { PieData } from "plotly.js";

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
                ...this.props,
                defaultData: this.getData(this.props)
            })
        );
    }

    private getData(props: PieChartContainerProps): PieData[] {
        if (props.sampleData) {
            const advancedOptions = props.dataOptions ? JSON.parse(props.dataOptions) : {};
            const sampleData = props.sampleData && props.sampleData.trim() ? JSON.parse(props.sampleData.trim()) : {};

            return [ deepMerge.all([ advancedOptions, {
                hole: props.chartType === "donut" ? 0.4 : 0,
                hoverinfo: props.tooltipForm ? "none" : "label",
                labels: sampleData.labels,
                marker: { colors: sampleData.colors },
                type: "pie",
                values: sampleData.values,
                sort: false
            } ]) ];
        }

        return [
            {
                hole: props.chartType === "donut" ? 0.4 : 0,
                hoverinfo: "label+name",
                labels: [ "US", "China", "European Union", "Russian Federation", "Brazil", "India", "Rest of World" ],
                name: "GHG Emissions",
                type: "pie",
                values: [ 16, 15, 12, 6, 5, 4, 42 ]
            }
        ];
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
