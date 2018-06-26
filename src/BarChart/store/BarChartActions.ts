import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";
import { ReactChild } from "react";
import { Action, Dispatch } from "redux";
import { seriesActionType } from "../../store/SeriesReducer";
import { fetchThemeConfigs as fetchBarThemeConfig } from "../../utils/configs";
import { fetchData as fetchSeriesData, generateRESTURL, parseAdvancedOptions } from "../../utils/data";
import { Data } from "../../utils/namespaces";
import { BarChartDataHandlerProps } from "../components/BarChartDataHandler";
import { getData } from "../utils/data";
import { BarChartAction, barPrefix } from "./BarChartReducer";

const actionType = seriesActionType(barPrefix);
export const showAlertMessage = (widgetID: string, alertMessage: ReactChild): Partial<BarChartAction> =>
    ({ type: actionType.ALERT_MESSAGE, widgetID, alertMessage });
export const isFetching = (widgetID: string, fetchingData: boolean): Partial<BarChartAction> =>
    ({ type: actionType.TOGGLE_FETCHING_DATA, widgetID, fetchingData });
export const noContext = (widgetID: string): Partial<BarChartAction> => ({ type: actionType.NO_CONTEXT, widgetID });

export const fetchData = (props: BarChartDataHandlerProps) => (dispatch: Dispatch<Partial<BarChartAction> & Action, any>) => {
    return () => {
        if (props.mxObject && props.series.length) {
            if (!props.fetchingData) {
                dispatch({ type: actionType.TOGGLE_FETCHING_DATA, widgetID: props.friendlyId, fetchingData: true });
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
                    sortAttribute: series.xValueSortAttribute || series.xValueAttribute,
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
                series: customData as Data.SeriesProps
            })))
            .then((data: Data.SeriesData<Data.SeriesProps>[]) => dispatch({
                seriesData: data,
                layoutOptions: props.layoutOptions || "{\n\n}",
                scatterData: getData(data, props),
                seriesOptions: data.map(({ series }) => series.seriesOptions || "{\n\n}"),
                configurationOptions: props.configurationOptions || "{\n\n}",
                widgetID: props.friendlyId,
                type: actionType.UPDATE_DATA_FROM_FETCH
            }))
            .catch(reason => {
                window.mx.ui.error(reason);
                dispatch({ type: actionType.FETCH_DATA_FAILED, widgetID: props.friendlyId });
            });
        } else {
            dispatch({ type: actionType.NO_CONTEXT, widgetID: props.friendlyId });
        }
    };
};

export const fetchThemeConfigs = (widgetID: string, orientation: "bar" | "column") => (dispatch: Dispatch<any, any>) => () => {
    dispatch({ type: actionType.FETCH_THEME_CONFIGS, widgetID });
    fetchBarThemeConfig(orientation === "bar" ? "BarChart" : "ColumnChart")
        .then(themeConfigs => dispatch({ type: actionType.FETCH_THEME_CONFIGS_COMPLETE, widgetID, themeConfigs }));
};

export const loadPlayground = (widgetID: string) => (dispatch: Dispatch<any, any>) => async () => {
    const { SeriesPlayground } = await import("../../components/SeriesPlayground");
    dispatch({ type: actionType.LOAD_PLAYGROUND, widgetID, playground: SeriesPlayground });
};

export const updateDataFromPlayground = (widgetID: string, scatterData: ScatterData[], layoutOptions: string, seriesOptions: string[], configurationOptions: string): Partial<BarChartAction> => {
    let newScatterData = scatterData;
    if (seriesOptions && seriesOptions.length) {
        newScatterData = scatterData.map((data, index) => {
            const parsedOptions = parseAdvancedOptions("developer", seriesOptions[index]);

            // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
            return { ...deepMerge.all<ScatterData>([ data, parsedOptions ]), customdata: data.customdata };
        });
    }

    return ({
        type: actionType.UPDATE_DATA_FROM_PLAYGROUND,
        widgetID,
        scatterData: newScatterData,
        layoutOptions,
        seriesOptions,
        configurationOptions
    });
};
export const toggleUpdatingData = (widgetID: string, updatingData: boolean): Partial<BarChartAction> =>
    ({ type: actionType.TOGGLE_UPDATING_DATA, widgetID, updatingData });
