import deepMerge from "deepmerge";
import { Config, Layout, ScatterData } from "plotly.js";
import { configs } from "../../utils/configs";
import { Container, Data } from "../../utils/namespaces";
import { defaultColours, getDimensionsFromNode } from "../../utils/style";
import { LineChartDataHandlerProps as LineChartProps } from "../components/LineChartDataHandler";
import { calculateBubbleSize, getStackedArea } from "./data";
import { parseAdvancedOptions } from "../../utils/data";
import { Transform } from "plotly.js/lib/core";

export const getDefaultLayoutOptions = (): Partial<Layout> => {
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

    return deepMerge.all([ configs.layout, defaultConfigs ]);
};

export const getCustomLayoutOptions = (props: LineChartProps): Partial<Layout> => {
    const sharedConfigs: Partial<Layout> = {
        showlegend: props.showLegend,
        margin: {
            t: props.type === "polar" ? 60 : 10
        }
    };

    if (props.type !== "polar") {
        const lineConfigs: Partial<Layout> = {
            xaxis: {
                fixedrange: props.xAxisType !== "date",
                rangeslider: {
                    visible: props.showRangeSlider || false
                },
                showgrid: props.grid === "vertical" || props.grid === "both",
                title: props.xAxisLabel,
                type: props.xAxisType
            },
            yaxis: {
                rangemode: props.rangeMode || "tozero",
                title: props.yAxisLabel,
                showgrid: props.grid === "horizontal" || props.grid === "both",
                fixedrange: true
            }
        };

        return { ...sharedConfigs, ...lineConfigs };
    } else if (props.type === "polar" && props.polar) {
        return { ...sharedConfigs, polar: props.polar } as Partial<Layout>;
    }

    return sharedConfigs;
};

export const getDefaultSeriesOptions = (): Partial<ScatterData> => ({
    connectgaps: true,
    hoverinfo: "none" as any, // typings don't have a hoverinfo value of "y"
    hoveron: "points"
});

export const getTransforms = (series: Data.LineSeriesProps, traces: Data.ScatterTrace): Transform[] | undefined => {
    const { aggregationType } = series;
    if (aggregationType !== "none" && traces) {
        return [ {
            type: "aggregate",
            groups: traces.x,
            aggregations: [ {
                target: "y",
                func: aggregationType,
                enabled: true
            } ]
        } as Transform ];
    }

    return undefined;
};

export const getCustomSeriesOptions = (series: Data.LineSeriesProps, props: LineChartProps, colourIndex: number, traces?: Data.ScatterTrace): Partial<ScatterData> => {
    const color: string | undefined = series.lineColor || defaultColours()[colourIndex];
    const mode = props.type === "bubble"
        ? "markers"
        : series.mode ? series.mode.replace("X", "+") as Container.LineMode : "lines";
    const seriesOptions: Partial<ScatterData> = {
        line: {
            color,
            shape: series.lineStyle
        },
        mode,
        name: series.name,
        type: getChartType(props.type) === "line" ? "scatter" : "scatterpolar" as any,
        fill: props.fill || series.fill
            ? props.type === "polar" ? "toself" : "tonexty"
            : "none",
        marker: props.type === "bubble" ? { line: { width: 0 } } : {},
        transforms: traces ? getTransforms(series, traces) : undefined
    };

    if (traces) {
        if (props.type === "polar") {
            return deepMerge.all([
                seriesOptions,
                traces,
                {
                    r: (traces.y as number[]).concat(traces.y[0] as number),
                    theta: traces.x.concat(traces.x[0])
                } as Partial<ScatterData> // this is equivalent to any so handle with caution
            ]);
        }

        return deepMerge.all([
            seriesOptions,
            traces,
            {
                text: traces.marker && traces.marker.size
                    ? (traces.marker.size as number[]).map(size => `${size}`)
                    : "" // show the size value on hover,
            }
        ]);
    }

    return seriesOptions;
};

export const getChartType = (type: string): "line" | "polar" => type !== "polar" ? "line" : "polar";

export const getDefaultConfigOptions = (): Partial<Config> => ({ displayModeBar: false, doubleClick: false });

export const getModelerLayoutOptions = (props: LineChartProps): Partial<Layout> => {
    return deepMerge.all([
        getDefaultLayoutOptions(),
        getCustomLayoutOptions(props),
        props.themeConfigs.layout
    ]);
};

export const getModelerSeriesOptions = (props: LineChartProps): string[] => {
    if (props.series) {
        return props.series.map((series, index) => {
            const customOptions = getCustomSeriesOptions(series, props, index);
            const seriesOptions = deepMerge.all([
                getDefaultSeriesOptions(),
                customOptions,
                props.themeConfigs.data
            ]);

            return JSON.stringify(seriesOptions, null, 2);
        });
    }

    return [];
};

export const parseScatterLayoutOptions = (props: LineChartProps): Partial<Layout> => {
    const advancedOptions = parseAdvancedOptions(props.devMode, props.layoutOptions);

    return deepMerge.all([ getModelerLayoutOptions(props), advancedOptions ]);
};

export const parseScatterData = (props: LineChartProps, chartNode?: HTMLDivElement) => {
    if (props.type === "area" && props.area === "stacked") {
        return getStackedArea(props.scatterData || []);
    }
    if (props.type === "bubble" && chartNode && props.scatterData) {
        return calculateBubbleSize(props.series, props.scatterData, getDimensionsFromNode(chartNode));
    }

    return props.scatterData || [];
};

export const getScatterConfigOptions = (props: LineChartProps): Partial<Config> => {
    const advancedOptions = parseAdvancedOptions(props.devMode, props.configurationOptions);

    return deepMerge.all([ getDefaultConfigOptions(), props.themeConfigs.configuration, advancedOptions ]);
};
