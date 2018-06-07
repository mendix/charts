import { Component, createElement } from "react";

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
        const alertMessage = validateSeriesProps(
            [ { ...this.props, seriesOptions: this.props.dataOptions } ],
            this.props.friendlyId,
            this.props.layoutOptions,
            this.props.configurationOptions
        );

        return createElement(PieChart, {
            ...this.props as PieChartContainerProps,
            alertMessage,
            devMode: this.props.devMode === "developer" ? "advanced" : this.props.devMode,
            defaultData: preview.getData(this.props),
            themeConfigs: { layout: {}, configuration: {}, data: {} }
        });
    }

    static getData(props: PieChartContainerProps): PieData[] {
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
                } as PieData
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

    visibilityMap.onClickMicroflow = valueMap.onClickEvent === "callMicroflow";
    visibilityMap.onClickNanoflow = valueMap.onClickEvent === "callNanoflow";
    visibilityMap.onClickPage = valueMap.onClickEvent === "showPage";
    visibilityMap.openPageLocation = valueMap.onClickEvent === "showPage";

    return visibilityMap;
}
