import { ReactChild } from "react";
import { Dispatch } from "react-redux";
import { ALERT_MESSAGE, FETCH_THEME_CONFIGS, FETCH_THEME_CONFIGS_COMPLETE, PieChartAction } from "./PieChartReducer";
import { fetchThemeConfigs as fetchPieThemeConfig } from "../../utils/configs";

export const showAlertMessage = (widgetID: string, alertMessage: ReactChild): Partial<PieChartAction> =>
    ({ type: ALERT_MESSAGE, widgetID, alertMessage });

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
