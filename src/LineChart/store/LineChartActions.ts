import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";
import { ReactChild } from "react";
import { Action, Dispatch } from "redux";
import { fetchData as fetchSeriesData, generateRESTURL, parseAdvancedOptions } from "../../utils/data";
import { Data } from "../../utils/namespaces";
import { getData } from "../utils/data";
import { ChartType, fetchThemeConfigs as fetchLineThemeConfig } from "../../utils/configs";
import {
    ALERT_MESSAGE,
    FETCH_DATA_FAILED,
    FETCH_THEME_CONFIGS,
    FETCH_THEME_CONFIGS_COMPLETE,
    LOAD_PLAYGROUND,
    LineChartAction,
    NO_CONTEXT,
    TOGGLE_FETCHING_DATA,
    UPDATE_DATA_FROM_FETCH,
    UPDATE_DATA_FROM_PLAYGROUND
} from "./LineChartReducer";
import { LineChartDataHandlerProps } from "../components/LineChartDataHandler";

export const showAlertMessage = (widgetID: string, alertMessage: ReactChild): Partial<LineChartAction> =>
    ({ type: ALERT_MESSAGE, widgetID, alertMessage });
export const isFetching = (widgetID: string, fetchingData: boolean): Partial<LineChartAction> =>
    ({ type: TOGGLE_FETCHING_DATA, widgetID, fetchingData });
export const noContext = (widgetID: string): Partial<LineChartAction> => ({ type: NO_CONTEXT, widgetID });

export const fetchData = (props: LineChartDataHandlerProps) => (dispatch: Dispatch<Partial<LineChartAction> & Action, any>) => {
    return () => {
        if (props.mxObject && props.series.length) {
            if (!props.fetchingData) {
                dispatch({ type: TOGGLE_FETCHING_DATA, widgetID: props.friendlyId, fetchingData: true });
            }

            Promise.all(props.series.map(series => {
                const attributes = [ series.xValueAttribute, series.yValueAttribute ];
                [ series.xValueSortAttribute, series.markerSizeAttribute ].forEach(attribute => {
                    if (attribute) {
                        attributes.push(attribute);
                    }
                });
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
            .then((data: Data.SeriesData<Data.LineSeriesProps>[]) => dispatch({
                data,
                layoutOptions: props.layoutOptions || "{\n\n}",
                scatterData: getData(data, props),
                seriesOptions: data.map(({ series }) => series.seriesOptions || "{\n\n}"),
                configurationOptions: props.configurationOptions || "{\n\n}",
                widgetID: props.friendlyId,
                type: UPDATE_DATA_FROM_FETCH
            }))
            .catch(reason => {
                window.mx.ui.error(reason);
                dispatch({ type: FETCH_DATA_FAILED, widgetID: props.friendlyId });
            });
        } else {
            dispatch({ type: NO_CONTEXT, widgetID: props.friendlyId });
        }
    };
};

export const fetchThemeConfigs = (widgetID: string, type: ChartType) => (dispatch: Dispatch<any, any>) => () => {
    dispatch({ type: FETCH_THEME_CONFIGS, widgetID });
    fetchLineThemeConfig(type)
        .then(themeConfigs => dispatch({ type: FETCH_THEME_CONFIGS_COMPLETE, widgetID, themeConfigs }))
        .catch(() => dispatch({
            type: FETCH_THEME_CONFIGS_COMPLETE,
            widgetID,
            themeConfigs: { layout: {}, configuration: {}, data: {} }
        }));
};

export const loadPlayground = (widgetID: string) => (dispatch: Dispatch<any, any>) => async () => {
    const { SeriesPlayground } = await import("../../components/SeriesPlayground");
    dispatch({ type: LOAD_PLAYGROUND, widgetID, playground: SeriesPlayground });
};

export const updateDataFromPlayground = (widgetID: string, scatterData: ScatterData[], layoutOptions: string, seriesOptions: string[], configurationOptions: string): Partial<LineChartAction> => {
    let newScatterData = scatterData;
    if (seriesOptions && seriesOptions.length) {
        newScatterData = scatterData.map((data, index) => {
            const parsedOptions = parseAdvancedOptions("developer", seriesOptions[index]);

            // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
            return { ...deepMerge.all<ScatterData>([ data, parsedOptions ]), customdata: data.customdata };
        });
    }

    return ({
        type: UPDATE_DATA_FROM_PLAYGROUND,
        widgetID,
        scatterData: newScatterData,
        layoutOptions,
        seriesOptions,
        configurationOptions
    });
};
