import deepMerge from "deepmerge";
import { arrayMerge } from "../../utils/data";
import { AnyChartProps } from "../components/AnyChart";
import { Config, Layout } from "plotly.js";

export const defaultConfigOptions: Partial<Config> = { displayModeBar: false, doubleClick: "reset" };
export const getConfigOptions = (props: AnyChartProps): Partial<Config> => {
    const parsedConfig: Partial<Config> = JSON.parse(props.configurationOptions || "{}");

    return deepMerge.all<Partial<Config>>([ defaultConfigOptions, parsedConfig ]);
};

export const getLayoutOptions = (props: AnyChartProps): Partial<Layout> => {
    const staticLayout: Partial<Layout> = JSON.parse(props.layoutStatic || "{}");
    const attributeLayout: Partial<Layout> = JSON.parse(props.attributeLayout || "{}");

    return props.attributeLayout
        ? deepMerge.all([ staticLayout, attributeLayout ], { arrayMerge })
        : staticLayout;
};

export const getData = (props: AnyChartProps): any[] => {
    const staticData: any[] = JSON.parse(props.dataStatic || "[]");

    return props.attributeData
        ? deepMerge.all([ staticData, JSON.parse(props.attributeData) ], { arrayMerge })
        : staticData;
};
