import * as BarChartConfigs from "../utils/configs";
import { BarChartProps } from "../components/BarChart";
import { Layout } from "plotly.js";
import { configs } from "../../utils/configs";
import { parseAdvancedOptions } from "../../utils/data";

describe("BarChart/utils/configs", () => {
    const barChart: Partial<BarChartProps> = {
        barMode: "group",
        showLegend: true,
        xAxisLabel: "title",
        grid: "both",
        yAxisLabel: "title"
    };

    describe("#getDefaultLayoutOptions", () => {
        it("combines layout configs with default configs", () => {
            const layoutOptions = BarChartConfigs.getDefaultLayoutOptions();
            const defaultConfigs: Partial<Layout> = {
                xaxis: {
                    fixedrange: true,
                    gridcolor: "#d7d7d7",
                    zerolinecolor: "#d7d7d7"
                },
                yaxis: {
                    fixedrange: true,
                    gridcolor: "#d7d7d7",
                    rangemode: "tozero",
                    zeroline: true,
                    zerolinecolor: "#d7d7d7"
                }
            };

            expect(layoutOptions).toEqual({ ...configs.layout, ...defaultConfigs });
        });
    });

    describe("#getCustomLayoutOptions", () => {
        it("returns a bar chart layout options object when orientation is bar", () => {
            const props: Partial<BarChartProps> = {
                ...barChart,
                orientation: "bar"
            };
            const customLayoutOptions = BarChartConfigs.getCustomLayoutOptions(props as BarChartProps);

            expect(customLayoutOptions).toEqual({
                xaxis: {
                    showgrid: true,
                    title: "title",
                    zeroline: true,
                    zerolinecolor: "#eaeaea"
                },
                yaxis: {
                    showgrid: true,
                    title: "title"
                },
                showlegend: true,
                barmode: "group"
            });
        });

        it("returns no bar chart layout options object when orientation is not bar", () => {
            const props: Partial<BarChartProps> = {
                ...barChart,
                orientation: "column"
            };
            const customLayoutOptions = BarChartConfigs.getCustomLayoutOptions(props as BarChartProps);

            expect(customLayoutOptions).toEqual({
                xaxis: {
                    showgrid: true,
                    title: "title",
                    zeroline: false,
                    zerolinecolor: undefined
                },
                yaxis: {
                    showgrid: true,
                    title: "title"
                },
                showlegend: true,
                barmode: "group"
            });
        });
    });

    describe("#getDefaultSeriesOptions", () => {
        it("returns default series options", () => {
            const chartType = BarChartConfigs.getDefaultSeriesOptions();

            expect(chartType).toEqual({
                hoverinfo: "none" as any,
                type: "bar"
            });
        });
    });

    describe("#getDefaultConfigOptions", () => {
        it("returns default configuration options", () => {
            const defaultConfigOptions = BarChartConfigs.getDefaultConfigOptions();

            expect(defaultConfigOptions).toEqual({ displayModeBar: false, doubleClick: false });
        });
    });

    describe("#getLayoutOptions", () => {
        it("returns layout options", () => {
            const props: Partial<BarChartProps> = {
                ...barChart,
                orientation: "bar",
                layoutOptions: `{ "font": { "color": "#555" }, "margin": { "t": 60 } }`,
                themeConfigs: { configuration: {}, data: {}, layout: {} } as any,
                configurationOptions: `{ "displayModeBar": false, "doubleClick": false }`
            };
            const layoutOptions = BarChartConfigs.getLayoutOptions(props as BarChartProps);
            const advancedOptions = parseAdvancedOptions("advanced", "");

            expect(layoutOptions).toEqual({ ...BarChartConfigs.getModelerLayoutOptions(props as BarChartProps), ...advancedOptions });
        });
    });

    describe("#getConfigOptions", () => {
        it("returns charts configuration options", () => {
            const barProps: Partial<BarChartProps> = {
                ...barChart,
                orientation: "bar",
                layoutOptions: `{ "font": { "color": "#333" }, "margin": { "t": 60 } }`,
                themeConfigs: { configuration: {}, data: {}, layout: {} },
                configurationOptions: `{ "displayModeBar": false, "doubleClick": false }`
            };
            const configOptions = BarChartConfigs.getConfigOptions(barProps as BarChartProps);
            const advancedOptions = parseAdvancedOptions("basic", "");

            expect(configOptions).toEqual({ ...BarChartConfigs.getDefaultConfigOptions(), ...{}, ...advancedOptions });
        });
    });
});
