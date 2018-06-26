import { ReactChild } from "react";
import { Dispatch } from "react-redux";
import {
    ALERT_MESSAGE,
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

export const showAlertMessage = (widgetID: string, alertMessage: ReactChild): Partial<PieChartAction> =>
    ({ type: ALERT_MESSAGE, widgetID, alertMessage });
export const isFetching = (widgetID: string, fetchingData: boolean): Partial<PieChartAction> =>
    ({ type: TOGGLE_FETCHING_DATA, widgetID, fetchingData });
export const noContext = (widgetID: string): Partial<PieChartAction> => ({ type: NO_CONTEXT, widgetID });

export const fetchThemeConfigs = (widgetID: string) => (dispatch: Dispatch<any>) => () => {
    dispatch({ type: FETCH_THEME_CONFIGS, widgetID });
    fetchPieThemeConfig("PieChart")
        .then(themeConfigs => dispatch({ type: FETCH_THEME_CONFIGS_COMPLETE, widgetID, themeConfigs }));
};

export const fetchPieData = (props: PieChartDataHandlerProps) => (dispatch: Dispatch<Partial<PieChartAction> & Action>) => {
    return () => {
        if (props.mxObject && props.dataEntity) {
            if (!props.fetchingData) {
                dispatch({ type: TOGGLE_FETCHING_DATA, widgetID: props.friendlyId, fetchingData: true });
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
                widgetID: props.friendlyId,
                type: UPDATE_DATA_FROM_FETCH
            })).catch(error => {
                window.mx.ui.error(`An error occurred while retrieving data in ${props.friendlyId}:\n ${error.message}`);
                dispatch({ type: FETCH_DATA_FAILED, widgetID: props.friendlyId });
            });
        } else {
            dispatch({ type: NO_CONTEXT, widgetID: props.friendlyId });
        }
    };
};

export const loadPlayground = (widgetID: string) => (dispatch: Dispatch<any>) => async () => {
    const { PiePlayground } = await import("../components/PiePlayground");
    dispatch({ type: LOAD_PLAYGROUND, widgetID, playground: PiePlayground });
};

export const updateDataFromPlayground = (widgetID: string, dataOptions: string, layoutOptions: string, configurationOptions: string): Partial<PieChartAction> =>
    ({
        type: UPDATE_DATA_FROM_PLAYGROUND,
        widgetID,
        dataOptions,
        layoutOptions,
        configurationOptions
    });
export const toggleUpdatingData = (widgetID: string, updatingData: boolean): Partial<PieChartAction> =>
    ({ type: TOGGLE_UPDATING_DATA, widgetID, updatingData });
