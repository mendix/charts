import { Data } from "../../utils/namespaces";
import * as BarChartData from "../utils/data";
import { BarChartDataHandlerProps } from "../components/BarChartDataHandler";
import * as dataUtils from "../../utils/data";

describe("BarChart/utils/data", () => {
    describe("#getData", () => {
        it("returns chart data", () => {
            const barSeries: Partial<Data.SeriesProps> = {
                name: "Series 1",
                xValueAttribute: "xValue",
                xValueSortAttribute: "createdDate",
                yValueAttribute: "yValue",
                barColor: ""
            };

            const barProps: Partial<BarChartDataHandlerProps> = {
                devMode: "basic",
                barMode: "group",
                orientation: "column",
                themeConfigs: {
                    layout: {},
                    data: {}
                } as any
            };

            const barSeriesData: Data.SeriesData<Data.SeriesProps> = {
                data: [
                    {
                        get: jasmine.createSpy("get")
                    }
                ] as any,
                restData: undefined,
                series: barSeries as Data.SeriesProps
            };

            spyOn(dataUtils, "getSeriesTraces").and.callFake(() => {
                return { x: [ "Jan", "Feb", "Mar" ], y: [ 4, 5, 6 ] };
            });

            const data = BarChartData.getData([ barSeriesData ], barProps as BarChartDataHandlerProps);

            expect(data).toEqual([
                {
                    hoverinfo: "none",
                    name: "Series 1",
                    type: "bar",
                    marker: { color: "rgba(5, 149, 219, 1)" },
                    x: [ "Jan", "Feb", "Mar" ],
                    y: [ 4, 5, 6 ],
                    series: { name: "Series 1", xValueAttribute: "xValue", xValueSortAttribute: "createdDate", yValueAttribute: "yValue", barColor: "" },
                    orientation: "v",
                    customdata: [ { get: jasmine.any(Function) } ]
                }
            ] as any);
        });
    });
});
