import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { HeatMap } from "./components/HeatMap";

import { Container } from "../utils/namespaces";
import { PieData } from "plotly.js";
import { validateSeriesProps } from "../utils/data";
import HeatMapContainerProps = Container.HeatMapContainerProps;

// tslint:disable-next-line class-name
export class preview extends Component<HeatMapContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, { className: `widget-heat-map-alert` },
                validateSeriesProps([ { ...this.props, seriesOptions: this.props.dataOptions } ], this.props.friendlyId, this.props.layoutOptions)
            ),
            createElement(HeatMap, {
                ...this.props as HeatMapContainerProps,
                data: [ [ 1, 20, 30, 50, 1 ], [ 20, 1, 60, 80, 30 ], [ 30, 60, 1, -10, 20 ] ],
                horizontalValues: [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" ],
                verticalValues: [ "Morning", "Afternoon", "Evening" ],
                defaultData: preview.getData(this.props)
            })
        );
    }

    static getData(props: HeatMapContainerProps): PieData[] {
        return [];
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

export function getVisibleProperties(valueMap: HeatMapContainerProps, visibilityMap: VisibilityMap<HeatMapContainerProps>) { // tslint:disable-line max-line-length
    if (valueMap.dataSourceType === "XPath") {
        visibilityMap.dataSourceMicroflow = false;
    } else if (valueMap.dataSourceType === "microflow") {
        visibilityMap.entityConstraint = false;
    }
    visibilityMap.layoutOptions = false;
    visibilityMap.devMode = false;
    if (valueMap.onClickEvent === "doNothing") {
        visibilityMap.onClickPage = visibilityMap.onClickMicroflow = false;
    } else if (valueMap.onClickEvent === "callMicroflow") {
        visibilityMap.onClickPage = false;
    } else if (valueMap.onClickEvent === "showPage") {
        visibilityMap.onClickMicroflow = false;
    }

    return visibilityMap;
}
