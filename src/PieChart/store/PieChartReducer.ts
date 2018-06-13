import { Action, Reducer } from "redux";
import { PiePlayground } from "../components/PiePlayground";
import { ReactChild } from "react";
import { ChartConfigs } from "../../utils/configs";
import { PieData } from "plotly.js";

export type PieChartAction = Action & PieChartState & { widgetID: string };

export interface PieChartState {
    layoutOptions: string;
    dataOptions: string;
    configurationOptions: string;
    playground?: typeof PiePlayground;
    data?: mendix.lib.MxObject[];
    pieData?: PieData[];
    alertMessage?: ReactChild;
    fetchingData?: boolean;
    fetchingConfigs: boolean;
    themeConfigs: ChartConfigs;
}

export interface PieChartReducerState {
    [ widgetID: string ]: PieChartState;
}

const prefix = "PieChart";
export const RESET = `${prefix}.RESET`;
export const ALERT_MESSAGE = `${prefix}.ALERT_MESSAGE`;
export const TOGGLE_FETCHING_DATA = `${prefix}.TOGGLE_FETCHING_DATA`;
export const UPDATE_DATA_FROM_FETCH = `${prefix}.UPDATE_DATA_FROM_FETCH`;
export const FETCH_DATA_FAILED = `${prefix}.FETCH_DATA_FAILED`;
export const NO_CONTEXT = `${prefix}.NO_CONTEXT`;
export const LOAD_PLAYGROUND = `${prefix}.LOAD_PLAYGROUND`;
export const UPDATE_DATA_FROM_PLAYGROUND = `${prefix}.UPDATE_DATA_FROM_PLAYGROUND`;
export const FETCH_THEME_CONFIGS = `${prefix}.FETCH_THEME_CONFIGS`;
export const FETCH_THEME_CONFIGS_COMPLETE = `${prefix}.FETCH_THEME_CONFIGS_COMPLETE`;

export const defaultInstanceState: Partial<PieChartState> = {
    pieData: [],
    fetchingData: false,
    fetchingConfigs: false,
    themeConfigs: { layout: {}, configuration: {}, data: {} }
};

export const pieChartReducer: Reducer<PieChartReducerState> = (state = {} as PieChartReducerState, action: PieChartAction): PieChartReducerState => {
    switch (action.type) {
        case FETCH_THEME_CONFIGS:
            return {
                ...state,
                [action.widgetID]: {
                    ...defaultInstanceState,
                    ...state[action.widgetID],
                    fetchingConfigs: false,
                    fetchingData: true
                }
            };
        case ALERT_MESSAGE:
            return {
                ...state,
                [action.widgetID]: {
                    ...defaultInstanceState,
                    ...state[action.widgetID],
                    alertMessage: action.alertMessage
                } };
        case TOGGLE_FETCHING_DATA:
            return {
                ...state,
                [action.widgetID]: {
                    ...defaultInstanceState,
                    ...state[action.widgetID],
                    fetchingData: action.fetchingData
                } };
        case FETCH_DATA_FAILED:
            return { ...state, [action.widgetID]: { ...state[action.widgetID], pieData: [] } };
        case UPDATE_DATA_FROM_FETCH:
            return {
                ...state,
                [action.widgetID]: {
                    ...defaultInstanceState,
                    ...state[action.widgetID],
                    data: action.data,
                    fetchingData: false,
                    layoutOptions: action.layoutOptions,
                    pieData: action.pieData && action.pieData.slice()
                }
            };
        case NO_CONTEXT:
            return {
                ...state,
                [action.widgetID]: {
                    ...defaultInstanceState,
                    ...state[action.widgetID],
                    ...defaultInstanceState
                } };
        case LOAD_PLAYGROUND:
            return {
                ...state,
                [action.widgetID]: {
                    ...defaultInstanceState,
                    ...state[action.widgetID],
                    playground: action.playground
                } };
        case UPDATE_DATA_FROM_PLAYGROUND:
            return {
                ...state,
                [action.widgetID]: {
                    ...defaultInstanceState,
                    ...state[action.widgetID],
                    layoutOptions: action.layoutOptions,
                    dataOptions: action.dataOptions,
                    configurationOptions: action.configurationOptions
                }
            };
        default:
            return state;
    }
};
