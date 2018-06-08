import deepMerge from "deepmerge";
import { getSeriesTraces, parseAdvancedOptions } from "../../utils/data";
import { Data } from "../../utils/namespaces";
import { ScatterData } from "plotly.js";
import { getCustomSeriesOptions, getDefaultSeriesOptions } from "./configs";
import { LineChartDataHandlerProps } from "../components/LineChartDataHandler";
import LineSeriesProps = Data.LineSeriesProps;

export const getData = (seriesData: Data.SeriesData<LineSeriesProps>[], props: LineChartDataHandlerProps): ScatterData[] =>
    seriesData.map(({ data, restData, series }, index) => {
        const advancedOptions = parseAdvancedOptions(props.devMode, series.seriesOptions);
        const traces = getSeriesTraces({ data, restData, series });
        const modellerOptions = getCustomSeriesOptions(series, props, index, traces);
        const themeConfigs = props.devMode !== "basic" ? props.themeConfigs.data : {};
        const customOptions = {
            customdata: data as mendix.lib.MxObject[], // each array element shall be returned as the custom data of a corresponding point
            series // shall be accessible via the data property of a hover/click point
        };

        return {
            ...deepMerge.all<ScatterData>([
                getDefaultSeriesOptions(),
                modellerOptions,
                themeConfigs,
                advancedOptions
            ]),
            ...customOptions
        };
    });
