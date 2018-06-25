import deepMerge from "deepmerge";
import { Config, Layout, ScatterData } from "plotly.js";
import { configs } from "../../utils/configs";
import { Data } from "../../utils/namespaces";
import { defaultColours } from "../../utils/style";
import { BarChartProps } from "../components/BarChart";
import { parseAdvancedOptions } from "../../utils/data";

export const getDefaultLayoutOptions = (): Partial<Layout> => {
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

    return deepMerge.all([ configs.layout, defaultConfigs ]);
};

export const getCustomLayoutOptions = (props: BarChartProps): Partial<Layout> => {
    return {
        barmode: props.barMode,
        showlegend: props.showLegend,
        xaxis: {
            showgrid: props.grid === "vertical" || props.grid === "both",
            title: props.xAxisLabel,
            zeroline: props.orientation === "bar" ? true : false,
            zerolinecolor: props.orientation === "bar" ? "#eaeaea" : undefined
        },
        yaxis: {
            showgrid: props.grid === "horizontal" || props.grid === "both",
            title: props.yAxisLabel
        }
    };
};

export const getDefaultSeriesOptions = (): Partial<ScatterData> => ({
    hoverinfo: "none" as any, // typings don't have a hoverinfo value of "y"
    type: "bar"
});

export const getCustomSeriesOptions = (series: Data.SeriesProps, orientation: "bar" | "column", colourIndex: number, traces?: Data.ScatterTrace) => {
    const color: string | undefined = series.barColor || defaultColours()[colourIndex];
    const seriesOptions = {
        marker: color ? { color } : {},
        name: series.name,
        orientation: orientation === "bar" ? "h" : "v"
    };
    if (traces) {
        return {
            ... seriesOptions,
            x: orientation === "bar" ? traces.y : traces.x,
            y: orientation === "bar" ? traces.x : traces.y
        };
    }

    return seriesOptions;
};

export const getDefaultConfigOptions = (): Partial<Config> => ({ displayModeBar: false, doubleClick: false });

export const getLayoutOptions = (props: BarChartProps): Partial<Layout> => {
    const advancedOptions = parseAdvancedOptions(props.devMode, props.layoutOptions);

    return deepMerge.all([ getModelerLayoutOptions(props), advancedOptions ]);
};

export const getModelerLayoutOptions = (props: BarChartProps): Partial<Layout> => {
    const themeLayoutOptions = props.devMode !== "basic" ? props.themeConfigs.layout : {};

    return deepMerge.all([
        getDefaultLayoutOptions(),
        getCustomLayoutOptions(props),
        themeLayoutOptions
    ]);
};

export const getConfigOptions = (props: BarChartProps): Partial<Config> => {
    const advancedOptions = parseAdvancedOptions(props.devMode, props.configurationOptions);

    return deepMerge.all([ getDefaultConfigOptions(), props.themeConfigs.configuration, advancedOptions ]);
};

export const getModelerSeriesOptions = (props: BarChartProps): string[] => {
    const themeSeriesOptions = props.devMode !== "basic" ? props.themeConfigs.data : {};

    return props.series ? props.series.map((series, index) => {
        const customOptions = getCustomSeriesOptions(series, props.orientation, index);
        const seriesOptions = deepMerge.all([ getDefaultSeriesOptions(), customOptions, themeSeriesOptions ]);

        return JSON.stringify(seriesOptions, null, 2);
    }) : [];
};
