import { Config, Layout } from "plotly.js";
import deepMerge from "deepmerge";

export const configs: SharedConfigs = {
    layout: {
        font: {
            family: "Open Sans",
            size: 14,
            color: "#555"
        },
        autosize: true,
        hovermode: "closest",
        hoverlabel: {
            bgcolor: "#888",
            bordercolor: "#888",
            font: {
                color: "#FFF"
            }
        },
        margin: {
            l: 60,
            r: 60,
            b: 60,
            t: 60,
            pad: 10
        }
    },
    configuration: { displayModeBar: false, doubleClick: false }
};

const getChartID = (type: ChartType): string => `com.mendix.widget.custom.${type}.${type}`;

export const fetchThemeConfigs = (type: ChartType): Promise<ChartConfigs> =>
    new Promise<ChartConfigs>((resolve, reject) => {
        try {
            const cacheBurst = window.dojoConfig.cacheBust;
            window.fetch(`${window.mx.baseUrl}../widgets/com.mendix.charts.json?${cacheBurst}`)
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }

                    return { layout: {}, configuration: {} };
                })
                .then(themeConfigs => {
                    resolve(processChartConfigs(type, themeConfigs));
                })
                .catch(error => {
                    console.log("An error occurred while fetching theme configs", error); // tslint:disable-line
                    reject(error);
                });
        } catch (e) {
            console.log("An error occurred while fetching theme configs", e); // tslint:disable-line
            reject(e);
        }
    });

export const processChartConfigs = (type: ChartType, themeConfigs: ThemeConfigs): ChartConfigs => {
    const sharedLayout = themeConfigs.layout || {};
    const sharedConfiguration = themeConfigs.configuration || {};
    const { charts } = themeConfigs;
    if (charts) {
        const chartConfigs = (charts as any)[getChartID(type)];

        return {
            layout: deepMerge.all([ sharedLayout, (chartConfigs && chartConfigs.layout) || {} ]),
            configuration: deepMerge.all([ sharedConfiguration, (chartConfigs && chartConfigs.configuration) || {} ]),
            data: (chartConfigs && chartConfigs.data) || {}
        };
    }

    return { layout: sharedLayout, configuration: sharedConfiguration, data: {} };
};

export const arrayMerge = (_destinationArray: any[], sourceArray: any[]) => sourceArray;

type ChartType = "LineChart" | "BubbleChart" | "PieChart" | "HeatMap" | "AnyChart" |
    "PolarChart" | "BarChart" | "AreaChart" | "TimeSeries" | "ColumnChart";

interface SharedConfigs {
    layout: Partial<Layout>;
    configuration: Partial<Config>;
}

export type ChartConfigs = SharedConfigs & { data: Partial<{}> };
export interface ThemeConfigs extends SharedConfigs {
    charts?: {
        "com.mendix.widget.custom.LineChart.LineChart"?: ChartConfigs;
        "com.mendix.widget.custom.BarChart.BarChart"?: ChartConfigs;
        "com.mendix.widget.custom.ColumnChart.ColumnChart"?: ChartConfigs;
        "com.mendix.widget.custom.TimeSeries.TimeSeries"?: ChartConfigs;
        "com.mendix.widget.custom.AreaChart.AreaChart"?: ChartConfigs;
        "com.mendix.widget.custom.PieChart.PieChart"?: ChartConfigs;
        "com.mendix.widget.custom.PolarChart.PolarChart"?: ChartConfigs;
        "com.mendix.widget.custom.HeatMap.HeatMap"?: ChartConfigs;
        "com.mendix.widget.custom.BubbleChart.BubbleChart"?: ChartConfigs;
    };
}
