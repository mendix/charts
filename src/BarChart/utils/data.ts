import deepMerge from "deepmerge";
import { getSeriesTraces, parseAdvancedOptions } from "../../utils/data";
import { Data } from "../../utils/namespaces";
import { ScatterData } from "plotly.js";
import { getCustomSeriesOptions, getDefaultSeriesOptions } from "./configs";
import { BarChartDataHandlerProps } from "../components/BarChartDataHandler";

export const getData = (seriesData: Data.SeriesData[], props: BarChartDataHandlerProps): ScatterData[] =>
    seriesData.map(({ data, series }, index) => {
        const advancedOptions = parseAdvancedOptions(props.devMode, series.seriesOptions);
        const traces = getSeriesTraces({ data, series });
        const modellerOptions = getCustomSeriesOptions(series, props.orientation, index, traces);
        const customOptions = {
            customdata: data as mendix.lib.MxObject[], // each array element shall be returned as the custom data of a corresponding point
            series // shall be accessible via the data property of a hover/click point
        };

        return {
            ...deepMerge.all<ScatterData>([
                getDefaultSeriesOptions(),
                modellerOptions,
                props.themeConfigs.data,
                advancedOptions
            ]),
            ...customOptions
        };
    });
