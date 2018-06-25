import { Layout, ScatterData } from "plotly.js";
import deepMerge from "deepmerge";
import { configs } from "../../utils/configs";
import { Data } from "../../utils/namespaces";
import * as LineChartConfigs from "../utils/configs";
import { LineChartProps } from "../components/LineChart";

describe("LineChart/utils/configs", () => {
    describe("#getDefaultLayoutOptions", () => {
        it("combines layout configs with default configs", () => {
            const defaultConfigs: Partial<Layout> = {
                xaxis: {
                    zeroline: true,
                    fixedrange: true,
                    gridcolor: "#d7d7d7",
                    zerolinecolor: "#d7d7d7"
                },
                yaxis: {
                    fixedrange: true,
                    gridcolor: "#d7d7d7",
                    zeroline: true,
                    zerolinecolor: "#d7d7d7"
                }
            };
            const LayoutOptions = LineChartConfigs.getDefaultLayoutOptions();

            expect(LayoutOptions).toEqual({ ...configs.layout, ...defaultConfigs });
        });
    });

    describe("#getCustomLayoutOptions", () => {
        it("when chart type is polar returns layout options object", () => {
            const LineProps: Partial<LineChartProps> = {
                showLegend: true,
                type: "polar",
                polar: {
                    angularaxis: {
                        linecolor: "green"
                    }
                }
            };
            const sharedConfigs = LineChartConfigs.getCustomLayoutOptions(LineProps as LineChartProps);

            expect(sharedConfigs).toEqual({
                showlegend: true,
                margin: { t: 60 },
                polar: { angularaxis: { linecolor: "green" } }
            } as Partial<Layout>);

            const props: Partial<LineChartProps> = {
                showLegend: true,
                type: "polar"
            };
            const sharedConfigs2 = LineChartConfigs.getCustomLayoutOptions(props as LineChartProps);
            expect(sharedConfigs2).toEqual({ showlegend: true, margin: { t: 60 } });
        });

        it("when chart type is not polar returns layout options object", () => {
            const props: Partial<LineChartProps> = { showLegend: true, type: "line", grid: "both" };
            const sharedConfigs = LineChartConfigs.getCustomLayoutOptions(props as LineChartProps);

            expect(sharedConfigs).toEqual({
                showlegend: true,
                margin: { t: 10 },
                xaxis: { fixedrange: true, rangeslider: { visible: false }, showgrid: true, title: undefined, type: undefined },
                yaxis: { rangemode: "tozero", title: undefined, showgrid: true, fixedrange: true }
            });
        });
    });

    describe("#getDefaultSeriesOptions", () => {
        it("returns default series options", () => {
            const chartType = LineChartConfigs.getDefaultSeriesOptions();

            expect(chartType).toEqual({ connectgaps: true, hoverinfo: "none" as any, hoveron: "points" });
        });
    });

    describe("#getCustomSeriesOptions", () => {
        it("returns custom series options", () => {
            const traces: Data.ScatterTrace = {
                marker: {
                    size: [ 20, 18, 38, 26, 38, 16, 18, 39, 36, 16, 18, 45 ]
                },
                x: [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec" ],
                y: [ 66, 88, 99, 40, 30, 62, 11, 32, 23, 69, 33, 81 ]
            };
            const serie: Partial<Data.LineSeriesProps> = { lineColor: "green" };
            const props: Partial<LineChartProps> = { fill: true, type: "bubble", grid: "both" };
            const customSeriesOptions = LineChartConfigs.getCustomSeriesOptions(serie as Data.LineSeriesProps, props as LineChartProps, 1, traces);

            expect(customSeriesOptions).toEqual(
                deepMerge.all([ {
                    line: { color: "green", shape: undefined },
                    mode: "markers",
                    name: undefined,
                    type: "scatter",
                    fill: "tonexty",
                    marker: { line: { width: 0 }, size: [ 20, 18, 38, 26, 38, 16, 18, 39, 36, 16, 18, 45 ] },
                    x: [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec" ],
                    y: [ 66, 88, 99, 40, 30, 62, 11, 32, 23, 69, 33, 81 ],
                    text: [ "20", "18", "38", "26", "38", "16", "18", "39", "36", "16", "18", "45" ]
                } as Partial<ScatterData> ])
            );

            const polarProps: Partial<LineChartProps> = { type: "polar" };
            const customSeriesOptions2 = LineChartConfigs.getCustomSeriesOptions(serie as Data.LineSeriesProps, polarProps as LineChartProps, 1, traces);

            expect(customSeriesOptions2).toEqual(
                deepMerge.all([ {
                line: { color: "green", shape: undefined },
                mode: "lines",
                name: undefined,
                type: "scatterpolar" as any,
                fill: "none",
                marker: { size: [ 20, 18, 38, 26, 38, 16, 18, 39, 36, 16, 18, 45 ] },
                x: [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec" ],
                y: [ 66, 88, 99, 40, 30, 62, 11, 32, 23, 69, 33, 81 ],
                r: [ 66, 88, 99, 40, 30, 62, 11, 32, 23, 69, 33, 81, 66 ],
                theta: [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec", "Jan" ]
                } as Partial<ScatterData> ])
            );

            const serie2: Partial<Data.LineSeriesProps> = { mode: "linesXmarkers" as any };
            const polarProps2: Partial<LineChartProps> = { fill: true, type: "polar" };
            const customSeriesOptions3 = LineChartConfigs.getCustomSeriesOptions(serie2 as Data.LineSeriesProps, polarProps2 as LineChartProps, 1);

            expect(customSeriesOptions3).toEqual({
                line: { color: "rgba(23, 52, 123, 1)", shape: undefined },
                mode: "lines+markers",
                name: undefined,
                type: "scatterpolar" as any,
                fill: "toself",
                marker: {}
            });

            const traces3: Data.ScatterTrace = {
                marker: { },
                x: [ "Jan", "Feb", "Mar", "Apr" ],
                y: [ 66, 88, 99, 40 ]
            };
            const customSeriesOptions4 = LineChartConfigs.getCustomSeriesOptions(serie as Data.LineSeriesProps, props as LineChartProps, 1, traces3);

            expect(customSeriesOptions4).toEqual(
                deepMerge.all([ {
                    line: { color: "green", shape: undefined },
                    mode: "markers",
                    name: undefined,
                    type: "scatter",
                    fill: "tonexty",
                    marker: { line: { width: 0 } },
                    x: [ "Jan", "Feb", "Mar", "Apr" ],
                    y: [ 66, 88, 99, 40 ],
                    text: ""
                } as Partial<ScatterData> ])
            );

        });
    });

    describe("#getChartType", () => {
        it("returns chart type as line", () => {
            const chartType = LineChartConfigs.getChartType("line");

            expect(chartType).toEqual("line");
        });

        it("returns chart type as polar", () => {
            const chartType = LineChartConfigs.getChartType("polar");

            expect(chartType).toEqual("polar");
        });
    });

    describe("#getDefaultConfigOptions", () => {
        it("returns default configuration options", () => {
            const defaultConfigOptions = LineChartConfigs.getDefaultConfigOptions();

            expect(defaultConfigOptions).toEqual({ displayModeBar: false, doubleClick: false });
        });
    });
});
