import deepMerge from "deepmerge";
import { Data } from "../../utils/namespaces";
import { PieData } from "plotly.js";
import { PieChartDataHandlerProps } from "../components/PieChartDataHandler";
import { PieChartProps, PieTraces } from "../components/PieChart";
import { getDefaultDataOptions } from "./configs";
import { defaultColours } from "../../utils/style";

export const getData = (data: Data.FetchedData<string>, props: PieChartDataHandlerProps): PieData[] => {
    if ((data.mxObjects && data.mxObjects.length) || (data.restData && data.restData.length)) {
        const advancedOptions = props.devMode !== "basic" && props.dataOptions
            ? JSON.parse(props.dataOptions)
            : {};
        const arrayMerge = (_destinationArray: any[], sourceArray: any[]) => sourceArray;
        const traces = getTraces(data, props);

        return [
            {
                ...deepMerge.all(
                    [
                        getDefaultDataOptions(props as PieChartProps),
                        {
                            labels: traces.labels,
                            values: traces.values,
                            marker: { colors: traces.colors }
                        },
                        advancedOptions
                    ],
                    { arrayMerge }
                ),
                customdata: data.mxObjects || []
            }
        ];
    }

    return [];
};

export const getTraces = (data: Data.FetchedData<string>, props: PieChartDataHandlerProps): PieTraces => {
    const colors = props.colors && props.colors.length ? props.colors.map(color => color.color) : defaultColours();
    if (data.mxObjects) {
        return {
            colors,
            labels: data.mxObjects.map(mxObject => mxObject.get(props.nameAttribute) as string),
            values: data.mxObjects.map(mxObject => parseFloat(mxObject.get(props.valueAttribute) as string))
        };
    }
    if (data.restData) {
        return {
            colors,
            labels: data.restData.map((point: any) => point[props.nameAttribute]),
            values: data.restData.map((point: any) => point[props.valueAttribute])
        };
    }

    return { labels: [], values: [], colors: [] };
};
