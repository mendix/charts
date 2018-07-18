import { Component, createElement } from "react";
import { Provider } from "react-redux";
import deepMerge from "deepmerge";
import { store } from "../store";
import "./store/PieChartReducer"; // ==important==: without this, the reducer shall not be registered.

import PieChart from "./components/PieChart";

import { getInstanceID, validateSeriesProps } from "../utils/data";
import { Container } from "../utils/namespaces";
import { PieChartDataHandlerProps } from "./components/PieChartDataHandler";
import { PieData } from "plotly.js";
import { defaultColours } from "../utils/style";
import PieChartContainerProps = Container.PieChartContainerProps;

// tslint:disable-next-line class-name
export class preview extends Component<PieChartContainerProps, { updatingData: boolean }> {
    readonly state = { updatingData: true };
    private instanceID = getInstanceID(this.props.friendlyId, store, "pie");
    private scatterData = preview.getData(this.props);

    render() {
        const alertMessage = validateSeriesProps(
            [ { ...this.props, seriesOptions: this.props.dataOptions } ],
            this.props.friendlyId,
            this.props.layoutOptions,
            this.props.configurationOptions
        );

        return createElement(Provider, { store },
            createElement(PieChart, {
                ...this.props as PieChartDataHandlerProps,
                alertMessage,
                fetchingData: false,
                updatingData: this.state.updatingData,
                toggleUpdatingData: this.toggleUpdatingData,
                instanceID: this.instanceID,
                devMode: this.props.devMode === "developer" ? "advanced" : this.props.devMode,
                pieData: this.scatterData,
                themeConfigs: { layout: {}, configuration: {}, data: {} }
            })
        );
    }

    componentWillReceiveProps() {
        this.setState({ updatingData: true });
    }

    private toggleUpdatingData = (_widgetID: string, updatingData: boolean): any => {
        this.setState({ updatingData });
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
