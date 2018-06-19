import deepMerge from "deepmerge";
import { configs } from "../../utils/configs";
import { HeatMapProps } from "../components/HeatMap";
import { Config, HeatMapData, Layout } from "plotly.js";

export const getDefaultDataOptions = (props: HeatMapProps): Partial<HeatMapData> => ({
    type: "heatmap",
    hoverinfo: "none",
    showscale: props.data && props.data.showscale,
    colorscale: props.data && props.data.colorscale,
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

export const getDefaultConfigOptions = (): Partial<Config> =>
    ({ displayModeBar: false, doubleClick: false });
