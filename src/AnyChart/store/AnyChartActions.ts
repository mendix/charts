import { ALERT_MESSAGE, AnyChartAction, NO_CONTEXT, TOGGLE_FETCHING_DATA, UPDATE_DATA_FROM_FETCH } from "./AnyChartReducer";
import { ReactChild } from "react";
import { AnyChartDataHandlerProps } from "../components/AnyChartDataHandler";
import { renderError, validateAdvancedOptions } from "../../utils/data";

export const showAlertMessage = (widgetID: string, alertMessage: ReactChild): Partial<AnyChartAction> =>
    ({ type: ALERT_MESSAGE, widgetID, alertMessage });
export const isFetching = (widgetID: string, fetchingData: boolean): Partial<AnyChartAction> =>
    ({ type: TOGGLE_FETCHING_DATA, widgetID, fetchingData });
export const noContext = (widgetID: string): Partial<AnyChartAction> => ({ type: NO_CONTEXT, widgetID });
export const fetchAnyChartData = (props: AnyChartDataHandlerProps) => {
    const { dataAttribute, layoutAttribute, friendlyId, sampleData, sampleLayout } = props;
    const attributeData = props.mxObject && dataAttribute
        ? props.mxObject.get(dataAttribute) as string
        : sampleData || "[]";
    const attributeLayout = props.mxObject && layoutAttribute
        ? props.mxObject.get(layoutAttribute) as string
        : sampleLayout || "{}";
    const errorMessages: string[] = [];
    let error = validateAdvancedOptions(attributeData);
    if (error) {
        errorMessages.push(`Data Source attribute value contains invalid JSON: \n${error}`);
    }
    error = validateAdvancedOptions(attributeLayout);
    if (error) {
        errorMessages.push(`Layout Source attribute value contains invalid JSON: \n${error}`);
    }
    if (error) {
        return showAlertMessage(friendlyId, renderError(friendlyId, errorMessages));
    }

    return {
        fetchingData: false,
        attributeData,
        attributeLayout,
        type: UPDATE_DATA_FROM_FETCH,
        widgetID: friendlyId
    };
};
