import { ScatterData } from "plotly.js";
import { Data } from "../../utils/namespaces";
import * as LineChartData from "../utils/data";
import { LineChartDataHandlerProps } from "../components/LineChartDataHandler";
import * as dataUtils from "../../utils/data";

describe("LineChart/utils/data", () => {
    describe("#getData", () => {
        it("returns chart data", () => {
            const series: Partial<Data.LineSeriesProps> = {
                name: "Series 1",
                xValueAttribute: "xValue",
                xValueSortAttribute: "createdDate",
                yValueAttribute: "yValue",
                lineColor: "",
                aggregationType: "none"
            };
            const props: Partial<LineChartDataHandlerProps> = {
                devMode: "basic",
                themeConfigs: {
                    layout: {},
                    data: {}
                } as any
            };
            const serie: Data.SeriesData<Data.LineSeriesProps> = {
                data: [
                    {
                        get: jasmine.createSpy("get")
                    }
                ] as any,
                restData: undefined,
                series : series as Data.LineSeriesProps
            };

            spyOn(dataUtils, "getSeriesTraces").and.callFake(() => {
                return { x: [ "Jan", "Feb", "Mar" ], y: [ 4, 5, 6 ] };
            });

            const data = LineChartData.getData([ serie ], props as LineChartDataHandlerProps);

            expect(data).toEqual([ {
                connectgaps: true,
                hoverinfo: "none",
                hoveron: "points",
                line: { color: "rgba(5, 149, 219, 1)", shape: undefined },
                mode: "lines",
                fillcolor: undefined,
                name: "Series 1",
                type: "scatter",
                fill: "none",
                marker: { },
                x: [ "Jan", "Feb", "Mar" ],
                y: [ 4, 5, 6 ],
                text: "",
                customdata: [ { get: jasmine.any(Function) } ],
                series: { name: "Series 1", xValueAttribute: "xValue", xValueSortAttribute: "createdDate", yValueAttribute: "yValue", lineColor: "", aggregationType: "none" },
                visible: true,
                transforms: undefined
            } ] as any);
        });
    });

    describe("#getStackedArea", () => {
        it("returns stacked area", () => {
            const sampleScatterData: Partial<ScatterData> = {
                type: "scatter",
                visible: true,
                x: [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec" ],
                y: [ 71, 2, 8, 9, 45, 69, 64, 70, 0, 9, 21, 46 ]
            };
            const scatterData = [ sampleScatterData as ScatterData ];
            const stackedArea = LineChartData.getStackedArea(scatterData);

            expect(stackedArea).toEqual([ {
                type: "scatter",
                visible: true,
                x: [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec" ],
                y: [ 71, 2, 8, 9, 45, 69, 64, 70, 0, 9, 21, 46 ]
            } ]);
        });
    });

    describe("#getMarkerSizeReference", () => {
        it("calculates the bubble size of each data point", () => {
            const serie: Partial<Data.LineSeriesProps> = { autoBubbleSize: true, markerSizeReference: 0 };
            const markerSize = [ 1, 2, 1, 0 ];
            const dimensions = { width: 500, height: 500 };
            const markerSizeReference = LineChartData.getMarkerSizeReference(serie as Data.LineSeriesProps, markerSize, dimensions);

            expect(markerSizeReference).toEqual(Infinity);

            const markerSizeReference2 = LineChartData.getMarkerSizeReference(serie as Data.LineSeriesProps, markerSize);
            expect(markerSizeReference2).toEqual(Infinity);

            const serie2: Partial<Data.LineSeriesProps> = { autoBubbleSize: false, markerSizeReference: 1 };
            const markerSizeReference3 = LineChartData.getMarkerSizeReference(serie2 as Data.LineSeriesProps, []);
            expect(markerSizeReference3).toEqual(100);

            const serie3: Partial<Data.LineSeriesProps> = { autoBubbleSize: false, markerSizeReference: 0 };
            const markerSizeReference4 = LineChartData.getMarkerSizeReference(serie3 as Data.LineSeriesProps, []);
            expect(markerSizeReference4).toEqual(1);
        });
    });

    describe("#calculateBubbleSize", () => {
        it("calculates the bubble size of each data point", () => {
            const props: Partial<Data.LineSeriesProps> = { name: "Series 1" };
            const series = [ props as Data.LineSeriesProps ];
            const sampleScatterData: Partial<ScatterData> = { type: "scatter", marker: { size: [ 33, 26, 36, 40 ] } };
            const scatterData = [ sampleScatterData as ScatterData ];
            const output = LineChartData.calculateBubbleSize(series, scatterData, { width: 500, height: 500 });

            expect(output).toEqual([ {
                type: "scatter",
                marker: {
                    size: [ 33, 26, 36, 40 ],
                    sizemode: "diameter",
                    sizeref: 1
                },
                customdata: undefined
            } ] as any);
        });
    });
});
