import deepMerge from "deepmerge";
import { Config, Layout, ScatterData } from "plotly.js";
import { configs } from "../../utils/configs";
import { Container, Data } from "../../utils/namespaces";
import { defaultColours } from "../../utils/style";
import { LineChartProps } from "../components/LineChart";

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
        marker: props.type === "bubble" ? { line: { width: 0 } } : {}
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
