import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { PieChart } from "./components/PieChart";

import deepMerge from "deepmerge";
import { Container } from "../utils/namespaces";
import { PieData } from "plotly.js";
import { validateSeriesProps } from "../utils/data";
import PieChartContainerProps = Container.PieChartContainerProps;
import { defaultColours } from "../utils/style";

// tslint:disable-next-line class-name
export class preview extends Component<PieChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, { className: `widget-${this.props.chartType}-chart-alert` },
                validateSeriesProps([ { ...this.props, seriesOptions: this.props.dataOptions } ], this.props.friendlyId, this.props.layoutOptions)
            ),
            createElement(PieChart, {
                ...this.props as PieChartContainerProps,
                devMode: this.props.devMode === "developer" ? "advanced" : this.props.devMode,
                defaultData: preview.getData(this.props)
            })
        );
    }

    static getData(props: PieChartContainerProps): PieData[] {
        const advancedOptions = props.devMode !== "basic" && props.dataOptions
            ? JSON.parse(props.dataOptions)
            : {};

        return [
            deepMerge.all([
                {
                    hole: props.chartType === "donut" ? 0.4 : 0,
                    hoverinfo: "none",
                    name: "GHG Emissions",
                    type: "pie",
                    labels: [ "US", "China", "European Union" ],
                    values: [ 16, 15, 12 ],
                    marker:  {
                        colors: props.colors && props.colors.length
                            ? props.colors.map(color => color.color)
                            : defaultColours()
                    }
                },
                advancedOptions
            ])
        ];
    }
}

export function getPreviewCss() {
    return (
        require("../ui/Charts.scss") +
        require("../ui/ChartsLoading.scss") +
        require("plotly.js/src/css/style.scss")
    );
}

export function getVisibleProperties(valueMap: PieChartContainerProps, visibilityMap: VisibilityMap<PieChartContainerProps>) { // tslint:disable-line max-line-length
    if (valueMap.dataSourceType === "XPath") {
        visibilityMap.dataSourceMicroflow = false;
    } else if (valueMap.dataSourceType === "microflow") {
        visibilityMap.entityConstraint = false;
        visibilityMap.sortAttribute = false;
        visibilityMap.sortOrder = false;
    }
    visibilityMap.layoutOptions = false;
    visibilityMap.devMode = false;
    visibilityMap.dataOptions = false;
    if (valueMap.onClickEvent === "doNothing") {
        visibilityMap.onClickPage = visibilityMap.onClickMicroflow = false;
    } else if (valueMap.onClickEvent === "callMicroflow") {
        visibilityMap.onClickPage = false;
    } else if (valueMap.onClickEvent === "showPage") {
        visibilityMap.onClickMicroflow = false;
    }

    return visibilityMap;
}
