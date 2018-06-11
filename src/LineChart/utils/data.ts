import deepMerge from "deepmerge";
import { getSeriesTraces, parseAdvancedOptions } from "../../utils/data";
import { Data } from "../../utils/namespaces";
import { ScatterData } from "plotly.js";
import { getCustomSeriesOptions, getDefaultSeriesOptions } from "./configs";
import { LineChartDataHandlerProps } from "../components/LineChartDataHandler";
import LineSeriesProps = Data.LineSeriesProps;

export const getData = (seriesData: Data.SeriesData<LineSeriesProps>[], props: LineChartDataHandlerProps): ScatterData[] => {
    const scatterData: ScatterData[] = seriesData.map(({ data, restData, series }, index) => {
        const advancedOptions: ScatterData = parseAdvancedOptions(props.devMode, series.seriesOptions);
        const traces: Data.ScatterTrace = getSeriesTraces({ data, restData, series });
        const modellerOptions: Partial<ScatterData> = getCustomSeriesOptions(series, props, index, traces);
        const themeConfigs = props.devMode !== "basic" ? props.themeConfigs.data : {};
        const customOptions = {
            customdata: data as mendix.lib.MxObject[], // each array element shall be returned as the custom data of a corresponding point
            series, // shall be accessible via the data property of a hover/click point
            visible: advancedOptions.visible || true
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

    return scatterData;
};

export const getStackedArea = (traces: ScatterData[]) => {
    const dataCopy = deepCopyScatterData(traces);
    const visibleTraces = dataCopy.filter(data => data.visible === true);
    for (let i = 1; i < visibleTraces.length; i++) {
        for (let j = 0; j < (Math.min(visibleTraces[i].y.length, visibleTraces[i - 1].y.length)); j++) {
            (visibleTraces[i].y[j] as any) += visibleTraces[i - 1].y[j];
        }
    }

    return dataCopy;
};

const deepCopyScatterData = (traces: ScatterData[]) => {
    return traces.map(data => {
        const copy: any = {};
        for (const property in data) {
            if (data.hasOwnProperty(property)) {
                if (property !== "y") {
                    copy[property] = (data as any)[property];
                } else {
                    copy.y = data.y.slice();
                }
            }
        }

        return copy;
    });
};
