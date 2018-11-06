import { ReactChild } from "react";
import { Dispatch } from "react-redux";
import {
    ALERT_MESSAGE,
    CLEAR_INSTANCE_STATE,
    FETCH_DATA_FAILED,
    FETCH_THEME_CONFIGS,
    FETCH_THEME_CONFIGS_COMPLETE,
    HeatMapAction,
    LOAD_PLAYGROUND,
    NO_CONTEXT,
    TOGGLE_FETCHING_DATA,
    TOGGLE_UPDATING_DATA,
    UPDATE_DATA_FROM_FETCH,
    UPDATE_DATA_FROM_PLAYGROUND
} from "./HeatMapReducer";
import { fetchThemeConfigs as fetchPieThemeConfig } from "../../utils/configs";
import { HeatMapDataHandlerProps } from "../components/HeatMapDataHandler";
import { Action } from "redux";
import { fetchByMicroflow, fetchData, generateRESTURL } from "../../utils/data";
import { fetchSortedData, getValues, processColorScale, processZData } from "../utils/data";

export const showAlertMessage = (instanceID: string, alertMessage: ReactChild): Partial<HeatMapAction> =>
    ({ type: ALERT_MESSAGE, instanceID, alertMessage });
export const isFetching = (instanceID: string, fetchingData: boolean): Partial<HeatMapAction> =>
    ({ type: TOGGLE_FETCHING_DATA, instanceID, fetchingData });
export const noContext = (instanceID: string): Partial<HeatMapAction> => ({ type: NO_CONTEXT, instanceID });

export const fetchThemeConfigs = (instanceID: string) => (dispatch: Dispatch<any>) => () => {
    dispatch({ type: FETCH_THEME_CONFIGS, instanceID });
    fetchPieThemeConfig("PieChart")
        .then(themeConfigs => dispatch({ type: FETCH_THEME_CONFIGS_COMPLETE, instanceID, themeConfigs }))
        .catch(() => dispatch({
            type: FETCH_THEME_CONFIGS_COMPLETE,
            instanceID,
            themeConfigs: { layout: {}, configuration: {}, data: {} }
        }));
};

export const fetchHeatMapData = (props: HeatMapDataHandlerProps) => (dispatch: Dispatch<Partial<HeatMapAction> & Action>) => {
    return () => {
        if (props.mxObject && props.dataEntity) {
            if (!props.fetchingData) {
                dispatch({ type: TOGGLE_FETCHING_DATA, instanceID: props.instanceID, fetchingData: true });
            }
            const { dataEntity, dataSourceMicroflow, dataSourceType, mxObject, restUrl } = props;

            if (dataSourceType === "XPath") {
                fetchSortedData(props)
                    .then(data => dispatch({
                        heatmapData: data.data,
                        mxObjects: data.mxObjects,
                        layoutOptions: props.layoutOptions || "{\n\n}",
                        configurationOptions: props.configurationOptions || "{\n\n}",
                        instanceID: props.instanceID,
                        type: UPDATE_DATA_FROM_FETCH
                    }))
                    .catch(error => {
                        window.mx.ui.error(error);
                        dispatch({ type: FETCH_DATA_FAILED, instanceID: props.instanceID });
                    });
            } else if (dataSourceType === "microflow" && dataSourceMicroflow) {
                fetchByMicroflow(dataSourceMicroflow, mxObject.getGuid())
                    .then(data => {
                        const horizontalValues = getValues(props.horizontalNameAttribute, data);
                        const verticalValues = getValues(props.verticalNameAttribute, data);
                        dispatch({
                            heatmapData: {
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
                            instanceID: props.instanceID,
                            type: UPDATE_DATA_FROM_FETCH
                        });
                    })
                    .catch(reason => {
                        window.mx.ui.error(`An error occurred while retrieving chart data: ${reason}`);
                        dispatch({ type: FETCH_DATA_FAILED, instanceID: props.instanceID });
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
                        heatmapData: {
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
                        instanceID: props.instanceID,
                        type: UPDATE_DATA_FROM_FETCH
                    });
                }).catch(error => {
                    window.mx.ui.error(`An error occurred while retrieving data in ${props.friendlyId}:\n ${error.message}`);
                    dispatch({ type: FETCH_DATA_FAILED, instanceID: props.instanceID });
                });
            }
        } else {
            dispatch({ type: NO_CONTEXT, instanceID: props.instanceID });
        }
    };
};

export const loadPlayground = (instanceID: string) => (dispatch: Dispatch<any>) => async () => {
    const { PiePlayground } = await import("../../PieChart/components/PiePlayground");
    dispatch({ type: LOAD_PLAYGROUND, instanceID, playground: PiePlayground });
};

export const updateDataFromPlayground = (instanceID: string, dataOptions: string, layoutOptions: string, configurationOptions: string): Partial<HeatMapAction> =>
    ({
        type: UPDATE_DATA_FROM_PLAYGROUND,
        instanceID,
        dataOptions,
        layoutOptions,
        configurationOptions
    });
export const toggleUpdatingData = (instanceID: string, updatingData: boolean): Partial<HeatMapAction> =>
    ({ type: TOGGLE_UPDATING_DATA, instanceID, updatingData });

export const clearInstanceState = (instanceID: string) =>
    ({ type: CLEAR_INSTANCE_STATE, instanceID });
