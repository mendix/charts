import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";
import { ReactChild } from "react";
import { Dispatch } from "redux";
import { fetchData as fetchSeriesData, generateRESTURL, parseAdvancedOptions } from "../../utils/data";
import { Data } from "../../utils/namespaces";
import { getData } from "../utils/data";
import { fetchThemeConfigs as fetchBarThemeConfig } from "../../utils/configs";
import {
    ALERT_MESSAGE,
    BarChartAction,
    FETCH_DATA_FAILED,
    FETCH_THEME_CONFIGS,
    FETCH_THEME_CONFIGS_COMPLETE,
    LOAD_PLAYGROUND,
    NO_CONTEXT,
    RESET,
    TOGGLE_FETCHING_DATA,
    UPDATE_DATA_FROM_FETCH,
    UPDATE_DATA_FROM_PLAYGROUND
} from "./BarChartReducer";
import { BarChartDataHandlerProps } from "../components/BarChartDataHandler";

export const resetStore = () => ({  type: RESET });
export const showAlertMessage = (alertMessage: ReactChild): Partial<BarChartAction> => ({ type: ALERT_MESSAGE, alertMessage });
export const isFetching = (fetchingData: boolean): Partial<BarChartAction> => ({ type: TOGGLE_FETCHING_DATA, fetchingData });

export const fetchData = (props: BarChartDataHandlerProps) => (dispatch: Dispatch<BarChartAction, any>) => {
    return () => {
        if (props.mxObject && props.series.length) {
            if (!props.fetchingData) {
                dispatch({ type: TOGGLE_FETCHING_DATA, fetchingData: true } as BarChartAction);
            }

            Promise.all(props.series.map(series => {
                const attributes = [ series.xValueAttribute, series.yValueAttribute ];
                if (series.xValueSortAttribute) {
                    attributes.push(series.xValueSortAttribute);
                }
                const mxObject = props.mxObject as mendix.lib.MxObject;
                const url = series.restUrl && generateRESTURL(mxObject, series.restUrl, props.restParameters);

                return fetchSeriesData<Data.SeriesProps>({
                    guid: mxObject.getGuid(),
                    entity: series.dataEntity,
                    constraint: series.entityConstraint,
                    sortAttribute: series.xValueSortAttribute,
                    sortOrder: series.sortOrder,
                    type: series.dataSourceType,
                    attributes,
                    microflow: series.dataSourceMicroflow,
                    url: url && `${url}&seriesName=${series.name}`,
                    customData: series
                });
            }))
            .then(seriesData => seriesData.map(({ mxObjects, restData, customData }) => ({
                data: mxObjects,
                restData,
                series: customData as Data.LineSeriesProps
            })))
            .then((data: Data.SeriesData<Data.SeriesProps>[]) => dispatch({
                data,
                layoutOptions: props.layoutOptions || "{\n\n}",
                scatterData: getData(data, props),
                seriesOptions: data.map(({ series }) => series.seriesOptions || "{\n\n}"),
                configurationOptions: props.configurationOptions || "{\n\n}",
                type: UPDATE_DATA_FROM_FETCH
            } as BarChartAction))
            .catch(reason => {
                window.mx.ui.error(reason);
                dispatch({ type: FETCH_DATA_FAILED } as BarChartAction);
            });
        } else {
            dispatch({ type: NO_CONTEXT } as BarChartAction);
        }
    };
};

export const fetchThemeConfigs = (orientation: "bar" | "column") => (dispatch: Dispatch<any, any>) => () => {
    dispatch({ type: FETCH_THEME_CONFIGS });
    fetchBarThemeConfig(orientation === "bar" ? "BarChart" : "ColumnChart")
        .then(themeConfigs => dispatch({ type: FETCH_THEME_CONFIGS_COMPLETE, themeConfigs }))
        .catch(() => dispatch({
            type: FETCH_THEME_CONFIGS_COMPLETE,
            themeConfigs: { layout: {}, configuration: {}, data: {} }
        }));
};

export const loadPlayground = () => (dispatch: Dispatch<any, any>) => async () => {
    const { SeriesPlayground } = await import("../../components/SeriesPlayground");
    dispatch({ type: LOAD_PLAYGROUND, playground: SeriesPlayground });
};

export const updateDataFromPlayground = (scatterData: ScatterData[], layoutOptions: string, seriesOptions: string[], configurationOptions: string): Partial<BarChartAction> => {
    if (seriesOptions && seriesOptions.length) {
        const newScatterData = scatterData.map((data, index) => {
            const parsedOptions = parseAdvancedOptions("developer", seriesOptions[index]);

            // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
            return { ...deepMerge.all<ScatterData>([ data, parsedOptions ]), customdata: data.customdata };
        });

        return ({
            type: UPDATE_DATA_FROM_PLAYGROUND,
            scatterData: newScatterData,
            layoutOptions,
            seriesOptions,
            configurationOptions
        });
    }

    return ({ type: UPDATE_DATA_FROM_PLAYGROUND, scatterData, layoutOptions, seriesOptions });
};
