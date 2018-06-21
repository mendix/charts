import { Action, Reducer } from "redux";
import { Data } from "../utils/namespaces";
import { ScatterData } from "plotly.js";
import { SeriesPlayground } from "../components/SeriesPlayground";
import { ReactChild } from "react";

export interface SeriesInstanceState {
    alertMessage?: ReactChild;
    layoutOptions: string;
    series?: Data.SeriesProps[];
    data?: Data.SeriesData[];
    scatterData?: ScatterData[];
    seriesOptions?: string[];
    configurationOptions: string;
    themeConfigs: { layout: {}, configuration: {}, data: {} };
    playground?: typeof SeriesPlayground;
    fetchingConfigs: boolean;
    fetchingData: boolean;
}

export interface SeriesChartReducerState<T> {
    [ widgetID: string ]: T;
}

export interface InstanceAction extends Action, SeriesInstanceState {
    widgetID: string;
}

export const seriesActionType = (prefix: string) => ({
    ALERT_MESSAGE: `${prefix}.ALERT_MESSAGE`,
    TOGGLE_FETCHING_DATA: `${prefix}.TOGGLE_FETCHING_DATA`,
    UPDATE_DATA_FROM_FETCH: `${prefix}.UPDATE_DATA_FROM_FETCH`,
    FETCH_DATA_FAILED: `${prefix}.FETCH_DATA_FAILED`,
    NO_CONTEXT: `${prefix}.NO_CONTEXT`,
    LOAD_PLAYGROUND: `${prefix}.LOAD_PLAYGROUND`,
    UPDATE_DATA_FROM_PLAYGROUND: `${prefix}.UPDATE_DATA_FROM_PLAYGROUND`,
    FETCH_THEME_CONFIGS: `${prefix}.FETCH_THEME_CONFIGS`,
    FETCH_THEME_CONFIGS_COMPLETE: `${prefix}.FETCH_THEME_CONFIGS_COMPLETE`
});

export const seriesReducer = <T extends SeriesInstanceState, A extends InstanceAction>
    (actionPrefix: string, defaultInstanceState: T, defaultDataState: T): Reducer<SeriesChartReducerState<T>> =>
        (state: SeriesChartReducerState<T> = {}, action: A): SeriesChartReducerState<T> => {
            switch (action.type) {
                case seriesActionType(actionPrefix).FETCH_THEME_CONFIGS:
                    return {
                        ...state,
                        [action.widgetID]: {
                            ...defaultInstanceState as SeriesInstanceState,
                            ...state[action.widgetID] as SeriesInstanceState,
                            fetchingConfigs: false,
                            fetchingData: true
                        } as T
                    };
                case seriesActionType(actionPrefix).FETCH_THEME_CONFIGS_COMPLETE:
                    return {
                        ...state,
                        [action.widgetID]: {
                            ...defaultInstanceState as SeriesInstanceState,
                            ...state[action.widgetID] as SeriesInstanceState,
                            themeConfigs: action.themeConfigs,
                            fetchingConfigs: false
                        } as T
                    };
                case seriesActionType(actionPrefix).UPDATE_DATA_FROM_FETCH:
                    return {
                        ...state,
                        [action.widgetID]: {
                            ...defaultInstanceState as SeriesInstanceState,
                            ...state[action.widgetID] as SeriesInstanceState,
                            data: action.data && action.data.slice(),
                            layoutOptions: action.layoutOptions,
                            fetchingData: false,
                            scatterData: action.scatterData && action.scatterData.slice(),
                            seriesOptions: action.seriesOptions && action.seriesOptions.slice()
                        } as T
                    };
                case seriesActionType(actionPrefix).FETCH_DATA_FAILED:
                    return { ...state, [action.widgetID]: {
                        ...state[action.widgetID] as SeriesInstanceState,
                        ...defaultDataState as SeriesInstanceState
                    } as T };
                case seriesActionType(actionPrefix).NO_CONTEXT:
                    return {
                        ...state,
                        [action.widgetID]: {
                            ...defaultInstanceState as SeriesInstanceState,
                            ...state[action.widgetID] as SeriesInstanceState,
                            ...defaultDataState as SeriesInstanceState
                        } as T };
                case seriesActionType(actionPrefix).TOGGLE_FETCHING_DATA:
                    return {
                        ...state,
                        [action.widgetID]: {
                            ...defaultInstanceState as SeriesInstanceState,
                            ...state[action.widgetID] as SeriesInstanceState,
                            fetchingData: action.fetchingData
                        } as T };
                case seriesActionType(actionPrefix).LOAD_PLAYGROUND:
                    return {
                        ...state,
                        [action.widgetID]: {
                            ...defaultInstanceState as SeriesInstanceState,
                            ...state[action.widgetID] as SeriesInstanceState,
                            playground: action.playground
                        } as T };
                case seriesActionType(actionPrefix).UPDATE_DATA_FROM_PLAYGROUND:
                    return {
                        ...state,
                        [action.widgetID]: {
                            ...defaultInstanceState as SeriesInstanceState,
                            ...state[action.widgetID] as SeriesInstanceState,
                            layoutOptions: action.layoutOptions,
                            scatterData: action.scatterData && action.scatterData.slice(),
                            seriesOptions: action.seriesOptions && action.seriesOptions.slice(),
                            configurationOptions: action.configurationOptions
                        } as T
                    };
                case seriesActionType(actionPrefix).ALERT_MESSAGE:
                    return {
                        ...state,
                        [action.widgetID]: {
                            ...defaultInstanceState as SeriesInstanceState,
                            ...state[action.widgetID] as SeriesInstanceState,
                            alertMessage: action.alertMessage
                        } as T };
                default:
                    return state;
            }
};
