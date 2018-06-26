import deepMerge from "deepmerge";
import { configs } from "../../utils/configs";
import { HeatMapProps } from "../components/HeatMap";
import { Config, HeatMapData, Layout } from "plotly.js";
import { arrayMerge } from "../../utils/data";

export const getDefaultDataOptions = (props: HeatMapProps): Partial<HeatMapData> => ({
    type: "heatmap",
    hoverinfo: "none",
    showscale: props.heatmapData && props.heatmapData.showscale,
    colorscale: props.heatmapData && props.heatmapData.colorscale,
    xgap: 1,
    ygap: 1,
    colorbar: {
        y: 1,
        yanchor: "top",
        ypad: 0,
        xpad: 5,
        outlinecolor: "#9ba492"
    }
});

export const getDefaultLayoutOptions = (props: HeatMapProps): Partial<Layout> => {
    const defaultConfigs: Partial<Layout> = {
        showarrow: false,
        xaxis: {
            fixedrange: true,
            title: props.xAxisLabel,
            ticks: ""
        },
        yaxis: {
            fixedrange: true,
            title: props.yAxisLabel,
            ticks: ""
        }
    };

    return deepMerge.all([ configs.layout, defaultConfigs ]);
};

export const getDefaultConfigOptions = (): Partial<Config> => ({ displayModeBar: false, doubleClick: false });

export const getData = (props: HeatMapProps): HeatMapData[] => {
    if (props.heatmapData) {
        const { dataOptions } = props;
        const advancedOptions = props.devMode !== "basic" && dataOptions ? JSON.parse(dataOptions) : {};

        const data: HeatMapData = deepMerge.all([
            {
                ...getDefaultDataOptions(props),
                x: props.heatmapData.x,
                y: props.heatmapData.y,
                z: props.heatmapData.z,
                text: props.heatmapData.z.map(row => row.map(item => `${item}`)),
                zsmooth: props.smoothColor ? "best" : false
            },
            props.themeConfigs.data,
            advancedOptions
        ], { arrayMerge });
        data.colorscale = advancedOptions.colorscale || data.colorscale;

        return [ data ];
    }

    return [];
};

export const getLayoutOptions = (props: HeatMapProps): Partial<Layout> => {
    const { layoutOptions } = props;
    const advancedOptions = props.devMode !== "basic" && layoutOptions ? JSON.parse(layoutOptions) : {};

    return deepMerge.all([
        getDefaultLayoutOptions(props),
        {
            annotations: props.showValues
                ? getTextAnnotations(props.heatmapData, props.valuesColor)
                : undefined
        },
        props.themeConfigs.layout,
        advancedOptions
    ]);
};

export const getTextAnnotations = (data?: HeatMapData, valuesColor = "") => {
    const annotations: {}[] = [];
    if (data) {
        for (let i = 0; i < data.y.length; i++) {
            for (let j = 0; j < data.x.length; j++) {
                const result = {
                    xref: "x1",
                    yref: "y1",
                    x: data.x[ j ],
                    y: data.y[ i ],
                    text: data.z[ i ][ j ],
                    font: {
                        family: "Open Sans",
                        size: 14,
                        color: valuesColor || "#555"
                    },
                    showarrow: false
                };
                annotations.push(result);
            }
        }
    }

    return annotations;
};

export const getConfigOptions = (props: HeatMapProps): Partial<Config> => {
    const parsedConfig = props.devMode !== "basic" && props.configurationOptions
        ? JSON.parse(props.configurationOptions)
        : {};

    return deepMerge.all(
        [ { displayModeBar: false, doubleClick: false }, props.themeConfigs.configuration, parsedConfig ],
        { arrayMerge }
    );
};
