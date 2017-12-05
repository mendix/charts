import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { PieChart } from "./components/PieChart";
import { PieChartContainerProps } from "./components/PieChartContainer";

import { PieData } from "plotly.js";
import { validateSeriesProps } from "../utils/data";

// tslint:disable-next-line class-name
export class preview extends Component<PieChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, { className: `widget-${this.props.chartType}-chart-alert` },
                validateSeriesProps([ { ...this.props, seriesOptions: this.props.dataOptions } ], this.props.friendlyId, this.props.layoutOptions)
            ),
            createElement(PieChart, {
                ...this.props as PieChartContainerProps,
                defaultData: preview.getData(this.props)
            })
        );
    }

    static getData(props: PieChartContainerProps): PieData[] {
        return [
            {
                hole: props.chartType === "donut" ? 0.4 : 0,
                hoverinfo: "label+name",
                name: "GHG Emissions",
                type: "pie",
                labels: [ "US", "China", "European Union" ],
                values: [ 16, 15, 12 ]
            }
        ];
    }
}

export function getPreviewCss() {
    return (
        require("../ui/Charts.scss") +
        require("../ui/ChartsLoading.scss") +
        require("../ui/Sidebar.scss") +
        require("../ui/Playground.scss") +
        require("../ui/Panel.scss") +
        require("../ui/InfoTooltip.scss") +
        require("plotly.js/src/css/style.scss")
    );
}

export function getVisibleProperties(valueMap: PieChartContainerProps, visibilityMap: VisibilityMap<PieChartContainerProps>) { // tslint:disable-line max-line-length
    if (valueMap.dataSourceType === "XPath") {
        visibilityMap.dataSourceMicroflow = false;
    } else if (valueMap.dataSourceType === "microflow") {
        visibilityMap.entityConstraint = false;
    }
    visibilityMap.layoutOptions = false;
    visibilityMap.devMode = false;

    return visibilityMap;
}
