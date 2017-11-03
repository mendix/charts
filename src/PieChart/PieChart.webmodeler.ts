import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { PieChart } from "./components/PieChart";
import PieChartContainer, { PieChartContainerProps } from "./components/PieChartContainer";

import deepMerge from "deepmerge";
import { PieData } from "plotly.js";

// tslint:disable-next-line class-name
export class preview extends Component<PieChartContainerProps, {}> {
    private sampleTraces = {
        labels: [ "US", "China", "European Union" ],
        name: "GHG Emissions",
        values: [ 16, 15, 12 ]
    };

    render() {
        return createElement("div", {},
            createElement(Alert, { className: `widget-${this.props.chartType}-chart-alert` },
                PieChartContainer.validateProps(this.props)
            ),
            createElement(PieChart, {
                ...this.props,
                defaultData: this.getData(this.props)
            })
        );
    }

    private getData(props: PieChartContainerProps): PieData[] {
        if (props.sampleData) {
            const advancedOptions = props.dataOptions ? JSON.parse(props.dataOptions) : {};
            const sampleData = props.sampleData && props.sampleData.trim()
                ? JSON.parse(props.sampleData.trim())
                : this.sampleTraces;

            return [ deepMerge.all([ {
                hole: props.chartType === "donut" ? 0.4 : 0,
                hoverinfo: props.tooltipForm ? "none" : "label",
                labels: sampleData.labels,
                marker: { colors: sampleData.colors },
                type: "pie",
                values: sampleData.values,
                sort: false
            }, advancedOptions ]) ];
        }

        return [
            {
                hole: props.chartType === "donut" ? 0.4 : 0,
                hoverinfo: "label+name",
                name: "GHG Emissions",
                type: "pie",
                ...this.sampleTraces
            }
        ];
    }
}

export function getPreviewCss() {
    return (
        require("../ui/Charts.scss") +
        require("../ui/ChartsLoading.scss") +
        require("../ui/Accordion.scss") +
        require("../ui/Sidebar.css")
    );
}

export function getVisibleProperties(valueMap: PieChartContainerProps, visibilityMap: VisibilityMap<PieChartContainerProps>) { // tslint:disable-line max-line-length
    if (valueMap.dataSourceType === "XPath") {
        visibilityMap.dataSourceMicroflow = false;
    } else if (valueMap.dataSourceType === "microflow") {
        visibilityMap.entityConstraint = false;
    }
    if (valueMap.devMode === "basic") {
        visibilityMap.layoutOptions = false;
        visibilityMap.sampleData = false;
    }

    return visibilityMap;
}
