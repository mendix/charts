import deepMerge from "deepmerge";
import { PieChartProps } from "../components/PieChart";
import { Config, Layout, PieData } from "plotly.js";
import { configs } from "../../utils/configs";
import { arrayMerge, parseAdvancedOptions } from "../../utils/data";

export const getDefaultLayoutOptions = (props: PieChartProps): Partial<Layout> => {
    const defaultConfigs: Partial<Layout> = {
        font: {
            color: "#FFF",
            size: 12
        },
        showlegend: props.showLegend,
        legend: {
            font: {
                family: "Open Sans",
                size: 14,
                color: "#555"
            }
        },
        margin: {
            t: 10
        }
    };

    return deepMerge.all([ configs.layout, defaultConfigs ]);
};

export const getDefaultDataOptions = (props: PieChartProps): Partial<PieData> => {
    return {
        hole: props.chartType === "donut" ? 0.4 : 0,
        hoverinfo: "none",
        type: "pie",
        sort: false
    };
};

export const getData = (props: PieChartProps): PieData[] => {
    if (props.pieData && props.pieData.length) {
        const { dataOptions } = props;
        const advancedOptions = props.devMode !== "basic" && dataOptions ? JSON.parse(dataOptions) : {};
        const dataThemeConfigs = props.devMode !== "basic" ? props.themeConfigs.data : {};

        return [
            {
                ...deepMerge.all(
                    [
                        props.pieData[0],
                        dataThemeConfigs,
                        advancedOptions
                    ],
                    { arrayMerge }
                ),
                customdata: props.pieData[0].customdata
            }
        ];
    }

    return [];
};

export const getLayoutOptions = (props: PieChartProps): Partial<Layout> => {
    const { layoutOptions } = props;
    const advancedOptions = props.devMode !== "basic" && layoutOptions ? JSON.parse(layoutOptions) : {};
    const themeLayoutConfigs = props.devMode !== "basic" ? props.themeConfigs.layout : {};

    return deepMerge.all([ getDefaultLayoutOptions(props), themeLayoutConfigs, advancedOptions ]);
};

export const getDefaultConfigOptions = (): Partial<Config> =>
    ({ displayModeBar: false, doubleClick: false });

export const getConfigOptions = (props: PieChartProps): Partial<Config> => {
    const advancedOptions = parseAdvancedOptions(props.devMode, props.configurationOptions);

    return deepMerge.all([ getDefaultConfigOptions(), props.themeConfigs.configuration, advancedOptions ]);
};
