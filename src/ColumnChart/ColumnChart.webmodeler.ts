// import { Component, createElement } from "react";

// import { BarChart } from "../BarChart/components/BarChart";

// import { getRandomNumbers, validateSeriesProps } from "../utils/data";
// import deepMerge from "deepmerge";
// import { ScatterData } from "plotly.js";
// import { Container } from "../utils/namespaces";
// import BarChartContainerProps = Container.BarChartContainerProps;
// import { defaultColours } from "../utils/style";

// tslint:disable-next-line class-name
// export class preview extends Component<BarChartContainerProps, {}> {
//     render() {
//         const alertMessage = validateSeriesProps(
//             this.props.series,
//             this.props.friendlyId,
//             this.props.layoutOptions,
//             this.props.configurationOptions
//         );

//         return createElement(BarChart, {
//             ...this.props as BarChartContainerProps,
//             alertMessage,
//             devMode: this.props.devMode === "developer" ? "advanced" : this.props.devMode,
//             scatterData: this.getData(this.props),
//             themeConfigs: { layout: {}, configuration: {}, data: {} }
//         });
//     }

//     private getData(props: BarChartContainerProps): ScatterData[] {
//         if (props.series.length) {
//             return props.series.map((series, index) => {
//                 const sampleData = preview.getSampleTraces();

//                 return deepMerge.all([ {
//                     name: series.name,
//                     type: "bar",
//                     orientation: "v",
//                     x: sampleData.x || [],
//                     y: sampleData.y || [],
//                     series: {},
//                     marker: {  color: series.barColor || defaultColours()[index] },
//                     hoverinfo: "none"
//                 } as any ]);
//             });
//         }

//         return [
//             {
//                 type: "bar",
//                 orientation: "v",
//                 name: "Sample",
//                 hoverinfo: "none",
//                 series: {},
//                 marker: {  color: defaultColours()[0] },
//                 ...preview.getSampleTraces()
//             } as any
//         ];
//     }

//     private static getSampleTraces(): { x: (string | number)[], y: (string | number)[] } {
//         return {
//             x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ],
//             y: getRandomNumbers(4, 100)
//         };
//     }
// }

// export function getPreviewCss() {
//     return (
//         require("../ui/Charts.scss") +
//         require("../ui/ChartsLoading.scss") +
//         require("plotly.js/src/css/style.scss")
//     );
// }

// export function getVisibleProperties(valueMap: BarChartContainerProps, visibilityMap: VisibilityMap<BarChartContainerProps>) { // tslint:disable-line max-line-length
//     if (valueMap.series && Array.isArray(valueMap.series)) {
//         valueMap.series.forEach((series, index) => {
//             if (series.dataSourceType === "XPath") {
//                 visibilityMap.series[index].dataSourceMicroflow = false;
//             } else if (series.dataSourceType === "microflow") {
//                 visibilityMap.series[index].entityConstraint = false;
//                 visibilityMap.series[index].xValueSortAttribute = false;
//                 visibilityMap.series[index].sortOrder = false;
//             }
//             visibilityMap.series[index].seriesOptions = false;
//             visibilityMap.series[index].onClickMicroflow = series.onClickEvent === "callMicroflow";
//             visibilityMap.series[index].onClickNanoflow = series.onClickEvent === "callNanoflow";
//             visibilityMap.series[index].onClickPage = series.onClickEvent === "showPage";

//             visibilityMap.series[index].openPageLocation = series.onClickEvent === "showPage";
//         });
//     }
//     visibilityMap.layoutOptions = false;
//     visibilityMap.devMode = false;

//     return visibilityMap;
// }
