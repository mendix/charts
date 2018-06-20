import { Component, createElement } from "react";

import HeatMap, { HeatMapProps } from "./components/HeatMap";
import { HeatMapData } from "plotly.js";

import deepMerge from "deepmerge";
import { validateSeriesProps } from "../utils/data";
import { Container } from "../utils/namespaces";
import HeatMapContainerProps = Container.HeatMapContainerProps;
import { HeatMapDataHandlerProps } from "./components/HeatMapDataHandler";
import { Provider } from "react-redux";
import { store } from "./store";
import { getDefaultDataOptions } from "./utils/configs";
import { processColorScale } from "./utils/data";

// tslint:disable-next-line class-name
export class preview extends Component<HeatMapContainerProps, {}> {
    render() {
        const alertMessage = validateSeriesProps(
            [ { ...this.props, seriesOptions: this.props.dataOptions } ],
            this.props.friendlyId,
            this.props.layoutOptions,
            this.props.configurationOptions
        );

        return createElement(Provider, { store },
            createElement(HeatMap, {
                ...this.props as HeatMapDataHandlerProps,
                alertMessage,
                fetchingData: false,
                themeConfigs: { layout: {}, configuration: {}, data: {} },
                devMode: this.props.devMode === "developer" ? "advanced" : this.props.devMode,
                data: deepMerge.all(
                    [ getDefaultDataOptions(this.props as HeatMapProps), preview.getData(this.props) ]
                ) as HeatMapData
            })
        );
    }

    static getData(props: HeatMapContainerProps): HeatMapData {
        return {
            x: [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" ],
            y: [ "Morning", "Afternoon", "Evening" ],
            z: [ [ 1, 20, 30, 50, 1 ], [ 20, 1, 60, 80, 30 ], [ 30, 60, 1, -10, 20 ] ],
            zsmooth: props.smoothColor ? "best" : false,
            colorscale: processColorScale(props.scaleColors),
            showscale: props.showScale,
            type: "heatmap",
            hoverinfo: "none"
        };
    }
}

export function getPreviewCss() {
    return (
        require("../ui/Charts.scss") +
        require("../ui/ChartsLoading.scss") +
        require("plotly.js/src/css/style.scss")
    );
}

export function getVisibleProperties(valueMap: HeatMapContainerProps, visibilityMap: VisibilityMap<HeatMapContainerProps>) { // tslint:disable-line max-line-length
    if (valueMap.dataSourceType === "XPath") {
        visibilityMap.dataSourceMicroflow = false;
    } else if (valueMap.dataSourceType === "microflow") {
        visibilityMap.entityConstraint = false;
        visibilityMap.horizontalSortAttribute = false;
        visibilityMap.verticalSortAttribute = false;
        visibilityMap.horizontalSortOrder = false;
        visibilityMap.verticalSortOrder = false;
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
