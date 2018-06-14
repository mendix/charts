import { ReactChild } from "react";
import { Dispatch } from "react-redux";
import {
    ALERT_MESSAGE,
    FETCH_DATA_FAILED,
    FETCH_THEME_CONFIGS,
    FETCH_THEME_CONFIGS_COMPLETE,
    HeatMapAction,
    LOAD_PLAYGROUND,
    NO_CONTEXT,
    TOGGLE_FETCHING_DATA,
    UPDATE_DATA_FROM_FETCH,
    UPDATE_DATA_FROM_PLAYGROUND
} from "./HeatMapReducer";
import { fetchThemeConfigs as fetchPieThemeConfig } from "../../utils/configs";
import { HeatMapDataHandlerProps } from "../components/HeatMapDataHandler";
import { Action } from "redux";
import { fetchByMicroflow, fetchData, generateRESTURL } from "../../utils/data";
import { fetchSortedData, getValues, processColorScale, processZData } from "../utils/data";

export const showAlertMessage = (widgetID: string, alertMessage: ReactChild): Partial<HeatMapAction> =>
    ({ type: ALERT_MESSAGE, widgetID, alertMessage });
export const isFetching = (widgetID: string, fetchingData: boolean): Partial<HeatMapAction> =>
    ({ type: TOGGLE_FETCHING_DATA, widgetID, fetchingData });
export const noContext = (widgetID: string): Partial<HeatMapAction> => ({ type: NO_CONTEXT, widgetID });

export const fetchThemeConfigs = (widgetID: string) => (dispatch: Dispatch<any>) => () => {
    dispatch({ type: FETCH_THEME_CONFIGS, widgetID });
    fetchPieThemeConfig("PieChart")
        .then(themeConfigs => dispatch({ type: FETCH_THEME_CONFIGS_COMPLETE, widgetID, themeConfigs }))
        .catch(() => dispatch({
            type: FETCH_THEME_CONFIGS_COMPLETE,
            widgetID,
            themeConfigs: { layout: {}, configuration: {}, data: {} }
        }));
};

export const fetchPieData = (props: HeatMapDataHandlerProps) => (dispatch: Dispatch<Partial<HeatMapAction> & Action>) => {
    return () => {
        if (props.mxObject && props.dataEntity) {
            if (!props.fetchingData) {
                dispatch({ type: TOGGLE_FETCHING_DATA, widgetID: props.friendlyId, fetchingData: true });
            }
            const { dataEntity, dataSourceMicroflow, dataSourceType, mxObject, restUrl } = props;

            if (dataSourceType === "XPath") {
                fetchSortedData(props)
                    .then(data => dispatch({
                        data: data.data,
                        mxObjects: data.mxObjects,
                        layoutOptions: props.layoutOptions || "{\n\n}",
                        configurationOptions: props.configurationOptions || "{\n\n}",
                        widgetID: props.friendlyId,
                        type: UPDATE_DATA_FROM_FETCH
                    }))
                    .catch(error => {
                        window.mx.ui.error(error);
                        dispatch({ type: FETCH_DATA_FAILED, widgetID: props.friendlyId });
                    });
            } else if (dataSourceType === "microflow" && dataSourceMicroflow) {
                fetchByMicroflow(dataSourceMicroflow, mxObject.getGuid())
                    .then(data => {
                        const horizontalValues = getValues(props.horizontalNameAttribute, data);
                        const verticalValues = getValues(props.verticalNameAttribute, data);
                        dispatch({
                            data: {
                                x: horizontalValues,
                                y: verticalValues,
                                z: processZData(props, verticalValues, horizontalValues, data),
                                zsmooth: props.smoothColor ? "best" : false,
                                colorscale: processColorScale(props.scaleColors),
                                showscale: props.showScale,
                                type: "heatmap"
                            },
                            mxObjects: data,
                            layoutOptions: props.layoutOptions || "{\n\n}",
                            configurationOptions: props.configurationOptions || "{\n\n}",
                            widgetID: props.friendlyId,
                            type: UPDATE_DATA_FROM_FETCH
                        });
                    })
                    .catch(reason => {
                        window.mx.ui.error(`An error occurred while retrieving chart data: ${reason}`);
                        dispatch({ type: FETCH_DATA_FAILED, widgetID: props.friendlyId });
                    });
            } else if (dataSourceType === "REST" && restUrl) {
                const attributes = [
                    props.valueAttribute,
                    props.horizontalNameAttribute,
                    props.verticalNameAttribute
                ];
                if (props.horizontalSortAttribute) {
                    attributes.push(props.horizontalSortAttribute);
                }
                if (props.verticalSortAttribute) {
                    attributes.push(props.verticalSortAttribute);
                }
                const url = props.restUrl && generateRESTURL(mxObject, props.restUrl, props.restParameters);
                fetchData<string>({
                    guid: mxObject.getGuid(),
                    entity: dataEntity,
                    type: "REST",
                    attributes,
                    url
                }).then(data => {
                    const x = getValues(props.horizontalNameAttribute, [], data.restData);
                    const y = getValues(props.verticalNameAttribute, [], data.restData);
                    dispatch({
                        data: {
                            x,
                            y,
                            z: processZData(props, y, x, [], data.restData),
                            zsmooth: props.smoothColor ? "best" : false,
                            colorscale: processColorScale(props.scaleColors),
                            showscale: props.showScale,
                            type: "heatmap"
                        },
                        mxObjects: data,
                        layoutOptions: props.layoutOptions || "{\n\n}",
                        configurationOptions: props.configurationOptions || "{\n\n}",
                        widgetID: props.friendlyId,
                        type: UPDATE_DATA_FROM_FETCH
                    });
                }).catch(error => {
                    window.mx.ui.error(`An error occurred while retrieving data in ${props.friendlyId}:\n ${error.message}`);
                    dispatch({ type: FETCH_DATA_FAILED, widgetID: props.friendlyId });
                });
            }
        } else {
            dispatch({ type: NO_CONTEXT, widgetID: props.friendlyId });
        }
    };
};

export const loadPlayground = (widgetID: string) => (dispatch: Dispatch<any>) => async () => {
    const { PiePlayground } = await import("../../PieChart/components/PiePlayground");
    dispatch({ type: LOAD_PLAYGROUND, widgetID, playground: PiePlayground });
};

export const updateDataFromPlayground = (widgetID: string, dataOptions: string, layoutOptions: string, configurationOptions: string): Partial<HeatMapAction> =>
    ({
        type: UPDATE_DATA_FROM_PLAYGROUND,
        widgetID,
        dataOptions,
        layoutOptions,
        configurationOptions
    });
