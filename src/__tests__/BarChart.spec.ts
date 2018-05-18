// import deepMerge from "deepmerge";
// import { mount, shallow } from "enzyme";
// import { ScatterData, ScatterHoverData } from "plotly.js";
// import { createElement } from "react";
// import { mockMendix } from "../../tests/mocks/Mendix";
// import { BarChart, BarChartProps } from "../BarChart/components/BarChart";
// import { Alert } from "../components/Alert";
// import { ChartLoading } from "../components/ChartLoading";
// import { PlotlyChart } from "../components/PlotlyChart";
// import "../components/SeriesPlayground";
// import { getRandomNumbers } from "../utils/data";
// import { Container, Data } from "../utils/namespaces";
// import * as style from "../utils/style";

// import SeriesProps = Data.SeriesProps;

// describe("BarChart", () => {
//     const renderShallowBarChart = (props: BarChartProps) => shallow(createElement(BarChart, props));
//     const renderFullBarChart = (props: BarChartProps) => mount(createElement(BarChart, props));
//     let defaultProps: Partial<BarChartProps>;
//     const sampleSeries: Partial<SeriesProps>[] = [
//         {
//             name: "Series 1",
//             seriesOptions: "{}",
//             tooltipForm: "myTooltipForm.xml"
//         }
//     ];

//     beforeEach(() => {
//         defaultProps = {
//             loading: false,
//             series: sampleSeries as SeriesProps[],
//             devMode: "basic",
//             width: 100,
//             widthUnit: "percentage",
//             height: 100,
//             heightUnit: "pixels",
//             layoutOptions: "{}",
//             seriesOptions: [ "{}" ],
//             configurationOptions: "{}",
//             orientation: "bar",
//             themeConfigs: { layout: {}, configuration: {}, data: {} }
//         };
//         window.mendix = mockMendix as any;
//     });

//     it("with an alert message renders an alert", () => {
//         defaultProps.alertMessage = "alert message";
//         const chart = renderShallowBarChart(defaultProps as BarChartProps);

//         expect(chart).toBeElement(
//             createElement(Alert, { className: "widget-charts-bar-alert" }, defaultProps.alertMessage)
//         );
//     });

//     it("that is loading data renders a loading indicator", () => {
//         defaultProps.loading = true;
//         const chart = renderShallowBarChart(defaultProps as BarChartProps);

//         expect(chart).toBeElement(createElement(ChartLoading));
//     });

//     it("whose dev mode is developer renders the playground when loaded", (done) => {
//         const renderPlaygroundSpy = spyOn(BarChart.prototype, "renderPlayground" as any).and.callThrough();
//         defaultProps.devMode = "developer";
//         const chart = renderShallowBarChart(defaultProps as BarChartProps);
//         chart.setState({ playgroundLoaded: true });

//         window.setTimeout(() => {
//             expect(renderPlaygroundSpy).toHaveBeenCalled();

//             done();
//         }, 1000);
//     });

//     it("whose dev mode is basic does not renders the playground", (done) => {
//         defaultProps.devMode = "basic";
//         const renderPlaygroundSpy = spyOn(BarChart.prototype, "renderPlayground" as any).and.callThrough();
//         renderShallowBarChart(defaultProps as BarChartProps);

//         window.setTimeout(() => {
//             expect(renderPlaygroundSpy).not.toHaveBeenCalled();

//             done();
//         }, 500);
//     });

//     it("whose dev mode is advanced does not renders the playground", () => {
//         const renderPlaygroundSpy = spyOn(BarChart.prototype, "renderPlayground" as any).and.callThrough();
//         defaultProps.devMode = "advanced";
//         renderShallowBarChart(defaultProps as BarChartProps);

//         expect(renderPlaygroundSpy).not.toHaveBeenCalled();
//     });
//     // tslint:disable-next-line max-line-length
//     it("with no alert message, isn't loading and whose dev mode isn't set to developer renders the chart correctly", () => {
//         defaultProps.series = [];
//         const chart = renderShallowBarChart(defaultProps as BarChartProps);

//         expect(chart).toBeElement(
//             createElement(PlotlyChart,
//                 {
//                     type: "bar",
//                     style: { width: "100%", height: "100px" },
//                     layout: jasmine.any(Object) as any,
//                     data: [],
//                     config: { displayModeBar: false, doubleClick: false },
//                     onClick: jasmine.any(Function),
//                     onHover: jasmine.any(Function),
//                     getTooltipNode: jasmine.any(Function)
//                 }
//             )
//         );
//     });

//     it("updates the state with the new props when the props are changed", () => {
//         const chart = renderShallowBarChart(defaultProps as BarChartProps);
//         defaultProps.layoutOptions = "{}";
//         defaultProps.seriesOptions = [ "{}" ];
//         defaultProps.series = [
//             {
//                 name: "Series 2",
//                 seriesOptions: "",
//                 tooltipForm: "myTooltipForm.xml"
//             }
//         ] as SeriesProps[];
//         defaultProps.scatterData = [
//             {
//                 x: [ 1, 2, 3 ],
//                 y: [ 2, 4, 6 ]
//             }
//         ] as ScatterData[];
//         chart.setProps(defaultProps as BarChartProps);

//         expect(chart.state()).toEqual({
//             layoutOptions: defaultProps.layoutOptions,
//             series: defaultProps.series,
//             seriesOptions: defaultProps.seriesOptions,
//             scatterData: defaultProps.scatterData,
//             configurationOptions: defaultProps.configurationOptions,
//             playgroundLoaded: false
//         });
//     });

//     it("with the devMode basic should not merge the modeler JSON layout options", () => {
//         defaultProps.layoutOptions = "{ 'title': 'My Title' }";
//         defaultProps.devMode = "basic";
//         // const chart = renderShallowBarChart(defaultProps as BarChartProps);
//         // const chartInstance: any = chart.instance();

//         // expect(chartInstance.getLayoutOptions(defaultProps)).toEqual(
//         //     BarChart.defaultLayoutConfigs(defaultProps as BarChartProps)
//         // );
//     });

//     it("with the devMode developer should merge the modeler JSON layout options", () => {
//         defaultProps.layoutOptions = "{ \"title\": \"My Title\" }";
//         defaultProps.devMode = "developer";
//         // const chart = renderShallowBarChart(defaultProps as BarChartProps);
//         // const chartInstance: any = chart.instance();

//         // expect(chartInstance.getLayoutOptions(defaultProps)).toEqual({
//         //     ...BarChart.defaultLayoutConfigs(defaultProps as BarChartProps),
//         //     title: "My Title"
//         // });
//     });

//     it("with the devMode advanced should merge the modeler JSON layout options", () => {
//         defaultProps.layoutOptions = "{ \"title\": \"My Title\" }";
//         defaultProps.devMode = "advanced";
//         // const chart = renderShallowBarChart(defaultProps as BarChartProps);
//         // const chartInstance: any = chart.instance();

//         // expect(chartInstance.getLayoutOptions(defaultProps)).toEqual({
//         //     ...BarChart.defaultLayoutConfigs(defaultProps as BarChartProps),
//         //     title: "My Title"
//         // });
//     });

//     it("with the devMode basic should not merge the modeler JSON series options", () => {
//         defaultProps.scatterData = getData(defaultProps as BarChartProps);
//         defaultProps.seriesOptions = [ "{ \"orientation\": \"v\" }" ];
//         defaultProps.devMode = "basic";
//         const chart = renderShallowBarChart(defaultProps as BarChartProps);
//         const chartInstance: any = chart.instance();

//         expect(chartInstance.getData(defaultProps)).toEqual(defaultProps.scatterData);
//     });

//     it("with the devMode advanced should merge the modeler JSON series options", () => {
//         defaultProps.scatterData = getData(defaultProps as BarChartProps);
//         defaultProps.seriesOptions = [ "{ \"orientation\": \"v\" }" ];
//         defaultProps.devMode = "advanced";
//         const chart = renderShallowBarChart(defaultProps as BarChartProps);
//         const chartInstance: any = chart.instance();

//         expect(chartInstance.getData(defaultProps)).toEqual([
//             { ...defaultProps.scatterData[0], orientation: "v", customdata: undefined }
//         ]);
//     });

//     it("with the devMode developer should merge the modeler JSON series options", () => {
//         defaultProps.scatterData = getData(defaultProps as BarChartProps);
//         defaultProps.seriesOptions = [ "{ \"orientation\": \"v\" }" ];
//         defaultProps.devMode = "developer";
//         const chart = renderShallowBarChart(defaultProps as BarChartProps);
//         const chartInstance: any = chart.instance();

//         expect(chartInstance.getData(defaultProps)).toEqual([
//             { ...defaultProps.scatterData[0], orientation: "v", customdata: undefined }
//         ]);
//     });

//     describe("event handler", () => {
//         const plotlyEventData: ScatterHoverData<any> = {
//             event: {} as any,
//             points: [
//                 {
//                     data: {
//                         series: sampleSeries[0]
//                     },
//                     x: "X Value",
//                     y: 20,
//                     xaxis: {
//                         d2p: () => 100,
//                         l2p: () => 50,
//                         _offset: 12
//                     },
//                     yaxis: {
//                         d2p: () => 100,
//                         l2p: () => 50,
//                         _offset: 22
//                     },
//                     customdata: "customData"
//                 } as any
//             ]
//         };

//         it("#onClick() calls the parent onClick handler when one is specified", () => {
//             defaultProps.onClick = jasmine.createSpy("onClick");
//             const chart = renderShallowBarChart(defaultProps as BarChartProps);
//             (chart.instance() as any).onClick(plotlyEventData);

//             expect(defaultProps.onClick).toHaveBeenCalled();
//         });

//         it("#onHover() calls the parent onHover handler when one is specified", () => {
//             defaultProps.onHover = jasmine.createSpy("onHover");
//             spyOn(style, "getTooltipCoordinates").and.returnValue({ x: 4, y: 10 });
//             const chart = renderFullBarChart(defaultProps as BarChartProps);
//             const instance = chart.instance() as any;
//             instance.onHover(plotlyEventData);

//             expect(defaultProps.onHover).toHaveBeenCalled();
//         });
//     });

//     it("saves a reference of the tooltip node", () => {
//         const chart = renderFullBarChart(defaultProps as BarChartProps);
//         const instance: any = chart.instance();

//         expect(instance.tooltipNode).toBeDefined();
//     });
// });

// const getData = (props: Container.BarChartContainerProps): ScatterData[] => {
//     if (props.series.length) {
//         return props.series.map(series => {
//             const seriesOptions = props.devMode !== "basic" && series.seriesOptions.trim()
//                 ? JSON.parse(series.seriesOptions)
//                 : {};
//             const sampleData = getSampleTraces();

//             return deepMerge.all([ {
//                 name: series.name,
//                 type: "bar",
//                 orientation: "h",
//                 x: sampleData.x || [],
//                 y: sampleData.y || [],
//                 customdata: undefined
//             }, seriesOptions ]);
//         });
//     }

//     return [ {
//             type: "bar",
//             orientation: "h",
//             name: "Sample",
//             ...getSampleTraces()
//         } ] as ScatterData[];
// };

// const getSampleTraces = (): { x: (string | number)[], y: (string | number)[] } => {
//     return {
//         x: getRandomNumbers(4, 100),
//         y: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ]
//     };
// };
