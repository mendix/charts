import { ReactChild } from "react";
import { Dispatch } from "react-redux";
import {
    ALERT_MESSAGE,
    CLEAR_INSTANCE_STATE,
    FETCH_DATA_FAILED,
    FETCH_THEME_CONFIGS,
    FETCH_THEME_CONFIGS_COMPLETE,
    LOAD_PLAYGROUND,
    NO_CONTEXT,
    PieChartAction,
    TOGGLE_FETCHING_DATA,
    TOGGLE_UPDATING_DATA,
    UPDATE_DATA_FROM_FETCH,
    UPDATE_DATA_FROM_PLAYGROUND
} from "./PieChartReducer";
import { fetchThemeConfigs as fetchPieThemeConfig } from "../../utils/configs";
import { PieChartDataHandlerProps } from "../components/PieChartDataHandler";
import { Action } from "redux";
import { fetchData, generateRESTURL } from "../../utils/data";
import { getData } from "../utils/data";

export const showAlertMessage = (instanceID: string, alertMessage: ReactChild): Partial<PieChartAction> =>
    ({ type: ALERT_MESSAGE, instanceID, alertMessage });
export const isFetching = (instanceID: string, fetchingData: boolean): Partial<PieChartAction> =>
    ({ type: TOGGLE_FETCHING_DATA, instanceID, fetchingData });
export const noContext = (instanceID: string): Partial<PieChartAction> => ({ type: NO_CONTEXT, instanceID });

export const fetchThemeConfigs = (instanceID: string) => (dispatch: Dispatch<any>) => () => {
    dispatch({ type: FETCH_THEME_CONFIGS, instanceID });
    fetchPieThemeConfig("PieChart")
        .then(themeConfigs => dispatch({ type: FETCH_THEME_CONFIGS_COMPLETE, instanceID, themeConfigs }));
};

export const fetchPieData = (props: PieChartDataHandlerProps) => (dispatch: Dispatch<Partial<PieChartAction> & Action>) => {
    return () => {
        if (props.mxObject && props.dataEntity) {
            if (!props.fetchingData) {
                dispatch({ type: TOGGLE_FETCHING_DATA, instanceID: props.instanceID, fetchingData: true });
            }

            const attributes = [ props.nameAttribute, props.valueAttribute ];
            if (props.sortAttribute) {
                attributes.push(props.sortAttribute);
            }
            const url = props.restUrl && generateRESTURL(props.mxObject, props.restUrl, props.restParameters);

            fetchData<string>({
                guid: props.mxObject.getGuid(),
                entity: props.dataEntity,
                constraint: props.entityConstraint,
                sortAttribute: props.sortAttribute || props.nameAttribute,
                sortOrder: props.sortOrder,
                type: props.dataSourceType,
                attributes,
                microflow: props.dataSourceMicroflow,
                url
            }).then(data => dispatch({
                data: data.mxObjects,
                pieData: getData(data, props),
                layoutOptions: props.layoutOptions || "{\n\n}",
                configurationOptions: props.configurationOptions || "{\n\n}",
                instanceID: props.instanceID,
                type: UPDATE_DATA_FROM_FETCH
            })).catch(error => {
                window.mx.ui.error(`An error occurred while retrieving data in ${props.friendlyId}:\n ${error.message}`);
                dispatch({ type: FETCH_DATA_FAILED, instanceID: props.instanceID });
            });
        } else {
            dispatch({ type: NO_CONTEXT, instanceID: props.instanceID });
        }
    };
};

export const loadPlayground = (instanceID: string) => (dispatch: Dispatch<any>) => async () => {
    const { PiePlayground } = await import("../components/PiePlayground");
    dispatch({ type: LOAD_PLAYGROUND, instanceID, playground: PiePlayground });
};

export const updateDataFromPlayground = (instanceID: string, dataOptions: string, layoutOptions: string, configurationOptions: string): Partial<PieChartAction> =>
    ({
        type: UPDATE_DATA_FROM_PLAYGROUND,
        instanceID,
        dataOptions,
        layoutOptions,
        configurationOptions
    });

export const toggleUpdatingData = (instanceID: string, updatingData: boolean): Partial<PieChartAction> =>
    ({ type: TOGGLE_UPDATING_DATA, instanceID, updatingData });

export const clearInstanceState = (instanceID: string) =>
    ({ type: CLEAR_INSTANCE_STATE, instanceID });
