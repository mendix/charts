import * as HeatMapConfigs from "../../utils/configs";
import { HeatMapProps } from "../../components/HeatMap";
import { HeatMapData } from "plotly.js";

describe("HeatMap/utils/configs", () => {
    const defaultProps: Partial<HeatMapProps> = {
        devMode: "developer",
        showScale: true,
        themeConfigs: { configuration: { }, data: { }, layout: { } } as any
    };

    describe("#getData", () => {
        it("chart whose devMode is not set to basic and heatmapData configured gets configuration data", () => {
            const props: Partial<HeatMapProps> = {
                ...defaultProps,
                devMode: "developer",
                smoothColor: true,
                heatmapData: {
                    colorscale: [ [ "#3D9970" ], [ "#333" ], [ "#001f3f" ] ],
                    showscale: false,
                    type: "heatmap",
                    x: [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ],
                    y: [ "Morning", "Afternoon", "Evening" ],
                    zsmooth: false,
                    z: [ [ 78, 39, 91, 66, 84, 95, 11 ], [ 68, 78, 56, 98, 72, 70, 68 ], [ 88, 82, 3, 27, 9, 29, 36 ] ]
                }
            };
            const data = HeatMapConfigs.getData(props as HeatMapProps) as any;

            expect(data).toEqual([ {
                type: "heatmap",
                hoverinfo: "none",
                showscale: false,
                colorscale: [ [ "#3D9970" ], [ "#333" ], [ "#001f3f" ] ],
                xgap: 1, ygap: 1,
                colorbar: { y: 1, yanchor: "top", ypad: 0, xpad: 5, outlinecolor: "#9ba492" },
                x: [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ],
                y: [ "Morning", "Afternoon", "Evening" ],
                z: [ [ 78, 39, 91, 66, 84, 95, 11 ], [ 68, 78, 56, 98, 72, 70, 68 ], [ 88, 82, 3, 27, 9, 29, 36 ] ],
                text: [ [ "78", "39", "91", "66", "84", "95", "11" ], [ "68", "78", "56", "98", "72", "70", "68" ], [ "88", "82", "3", "27", "9", "29", "36" ] ],
                zsmooth: "best"
            } ]);
        });

        it("chart whose devMode is set to basic gets no data when heatmapData is not configured", () => {
            const props: Partial<HeatMapProps> = {
                ...defaultProps,
                devMode: "basic"
            };
            const data = HeatMapConfigs.getData(props as HeatMapProps) as any;

            expect(data).toEqual([ ]);
        });
    });

    describe("#getLayoutOptions", () => {
        const props: Partial<HeatMapProps> = {
            ...defaultProps,
            devMode: "developer",
            layoutOptions: `{
                "title":"Advanced Config JSON",
                "showlegend": false,
                "xaxis": {
                  "title": "Advanced X-Axis",
                  "showgrid": false
                }
            }`,
            showValues: true,
            valuesColor: "#000000"
        };
        it("chart whose devMode not set to devMode gets configured layouts with advanced options", () => {
            const layoutOptions: any = HeatMapConfigs.getLayoutOptions(props as HeatMapProps);

            expect(layoutOptions).toEqual({
                font: { family: "Open Sans", size: 14, color: "#555" },
                autosize: true,
                hovermode: "closest",
                hoverlabel: { bgcolor: "#888", bordercolor: "#888", font: { color: "#FFF" } },
                margin: { l: 60, r: 60, b: 60, t: 60, pad: 10 },
                showarrow: false, xaxis: { fixedrange: true, title: "Advanced X-Axis", ticks: "", showgrid: false },
                yaxis: { fixedrange: true, title: undefined, ticks: "" },
                annotations: [ ],
                title: "Advanced Config JSON",
                showlegend: false
            });
        });

        it("chart whose devMode is set to basic gets default layout options", () => {
            const heatMapProps: Partial<HeatMapProps> = {
                ...defaultProps,
                devMode: "basic"
            };
            const layoutOptions = HeatMapConfigs.getLayoutOptions(heatMapProps as HeatMapProps);

            expect(layoutOptions).toEqual({
                font: { family: "Open Sans", size: 14, color: "#555" },
                autosize: true,
                hovermode: "closest",
                hoverlabel: { bgcolor: "#888", bordercolor: "#888", font: { color: "#FFF" } },
                margin: { l: 60, r: 60, b: 60, t: 60, pad: 10 },
                showarrow: false,
                xaxis: { fixedrange: true, title: undefined, ticks: "" },
                yaxis: { fixedrange: true, title: undefined, ticks: "" },
                annotations: undefined
            });
        });
    });

    describe("#getTextAnnotations", () => {
        it("gets text annotations when heat map data is set", () => {
            const heatmapData: Partial<HeatMapData> = {
                colorscale: [ [ "#3D9970" ], [ "#333" ], [ "#001f3f" ] ],
                showscale: false,
                type: "heatmap",
                x: [ "Monday" ], y: [ "Morning" ], z: [ [ 78, 39, 91 ] ],
                zsmooth: false
            };
            const textAnnotations = HeatMapConfigs.getTextAnnotations(heatmapData as HeatMapData, "");

            expect(textAnnotations).toEqual([
                {
                    xref: "x1", yref: "y1", x: "Monday", y: "Morning", text: 78,
                    font: { family: "Open Sans", size: 14, color: "#555" },
                    showarrow: false
                }
            ]);
        });

        it("gets no annotations when heat map x, y, and z data are not set", () => {
            const heatmapData: Partial<HeatMapData> = {
                colorscale: [ ],
                showscale: false,
                type: "heatmap",
                x: [ ], y: [ ], z: [ ],
                zsmooth: false
            };
            const textAnnotation = HeatMapConfigs.getTextAnnotations(heatmapData as HeatMapData, "");

            expect(textAnnotation).toEqual([ ]);
        });
    });

    describe("#getConfigOptions", () => {
        const props: Partial<HeatMapProps> = {
            ...defaultProps,
            devMode: "developer",
            configurationOptions: `{ "displayModeBar": true }`
        };
        it("#getDefaultConfigOptions", () => {
            const defaultConfigs = HeatMapConfigs.getDefaultConfigOptions();

            expect(defaultConfigs).toEqual({ displayModeBar: false, doubleClick: false });
        });

        it("chart whose devMode is not basic and configurationOptions set, gets configured Options", () => {
            const configOptions = HeatMapConfigs.getConfigOptions(props as HeatMapProps);

            expect(configOptions).toEqual({ displayModeBar: true, doubleClick: false });
        });

        it("chart whose devMode is set to basic and configurationOptions not set, gets default configurations", () => {
            const heatMapProps: Partial<HeatMapProps> = {
                ...defaultProps,
                devMode: "basic",
                configurationOptions: ""
            };
            const configOption = HeatMapConfigs.getConfigOptions(heatMapProps as HeatMapProps);

            expect(configOption).toEqual({ displayModeBar: false, doubleClick: false });
        });
    });
});
