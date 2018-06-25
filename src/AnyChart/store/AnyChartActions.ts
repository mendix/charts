import {
    ALERT_MESSAGE,
    AnyChartAction,
    AnyChartData,
    FETCHED_DATA,
    NO_CONTEXT,
    TOGGLE_FETCHING_DATA,
    UPDATE_DATA_FROM_PLAYGROUND } from "./AnyChartReducer";
import { ReactChild } from "react";
import { AnyChartDataHandlerProps } from "../components/AnyChartDataHandler";
import { renderError, validateAdvancedOptions } from "../../utils/data";

export const showAlertMessage = (widgetID: string, alertMessage: ReactChild): Partial<AnyChartAction> =>
    ({ type: ALERT_MESSAGE, widgetID, alertMessage });
export const toggleFetchingData = (widgetID: string, fetchingData: boolean): Partial<AnyChartAction> =>
    ({ type: TOGGLE_FETCHING_DATA, widgetID, fetchingData });
export const noContext = (widgetID: string): Partial<AnyChartAction> => ({ type: NO_CONTEXT, widgetID });
export const fetchData = (props: AnyChartDataHandlerProps) => {
    const { dataAttribute, layoutAttribute, friendlyId, sampleData, sampleLayout } = props;
    const attributeData = props.mxObject && dataAttribute
        ? props.mxObject.get(dataAttribute) as string
        : sampleData || "[]";
    const attributeLayout = props.mxObject && layoutAttribute
        ? props.mxObject.get(layoutAttribute) as string
        : sampleLayout || "{}";
    const errorMessages: string[] = [];
    [ attributeData, attributeLayout ].forEach((data, index) => {
        const error = validateAdvancedOptions(data);
        const source = index ? "Layout" : "Data";
        if (error) {
            errorMessages.push(`${source} Source attribute value contains invalid JSON: \n${error}`);
        }
    });
    if (errorMessages.length) {
        return showAlertMessage(friendlyId, renderError(friendlyId, errorMessages));
    }

    return {
        fetchingData: false,
        attributeData,
        attributeLayout,
        dataStatic: props.dataStatic,
        layoutStatic: props.layoutStatic,
        configurationOptions: props.configurationOptions,
        type: FETCHED_DATA,
        widgetID: friendlyId
    };
};
export const updateDataFromPlayground = (widgetID: string, data: AnyChartData) =>
    ({ type: UPDATE_DATA_FROM_PLAYGROUND, widgetID, ...data });
