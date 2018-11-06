import { Action, Reducer } from "redux";
import { PiePlayground } from "../components/PiePlayground";
import { ReactChild } from "react";
import { ChartConfigs } from "../../utils/configs";
import { PieData } from "plotly.js";
import { DefaultReduxStore, registerReducer } from "../../store";

export type PieChartAction = Action & PieChartState & { instanceID: string };

export interface PieChartState {
    layoutOptions: string;
    dataOptions: string;
    configurationOptions: string;
    playground?: typeof PiePlayground;
    data?: mendix.lib.MxObject[];
    pieData?: PieData[];
    alertMessage?: ReactChild;
    fetchingData: boolean;
    fetchingConfigs: boolean;
    themeConfigs: ChartConfigs;
    updatingData: boolean;
}

export interface PieChartReducerState {
    [ widgetID: string ]: PieChartState;
}

export interface PieReduxStore extends DefaultReduxStore {
    pie: PieChartReducerState;
}

const prefix = "PieChart";
export const RESET = `${prefix}.RESET`;
export const ALERT_MESSAGE = `${prefix}.ALERT_MESSAGE`;
export const TOGGLE_FETCHING_DATA = `${prefix}.TOGGLE_FETCHING_DATA`;
export const TOGGLE_UPDATING_DATA = `${prefix}.TOGGLE_UPDATING_DATA`;
export const UPDATE_DATA_FROM_FETCH = `${prefix}.UPDATE_DATA_FROM_FETCH`;
export const FETCH_DATA_FAILED = `${prefix}.FETCH_DATA_FAILED`;
export const NO_CONTEXT = `${prefix}.NO_CONTEXT`;
export const LOAD_PLAYGROUND = `${prefix}.LOAD_PLAYGROUND`;
export const UPDATE_DATA_FROM_PLAYGROUND = `${prefix}.UPDATE_DATA_FROM_PLAYGROUND`;
export const FETCH_THEME_CONFIGS = `${prefix}.FETCH_THEME_CONFIGS`;
export const FETCH_THEME_CONFIGS_COMPLETE = `${prefix}.FETCH_THEME_CONFIGS_COMPLETE`;
export const CLEAR_INSTANCE_STATE = `${prefix}.CLEAR_INSTANCE_STATE`;

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
                [action.instanceID]: {
                    ...defaultInstanceState,
                    ...state[action.instanceID],
                    fetchingConfigs: true
                }
            };
        case FETCH_THEME_CONFIGS_COMPLETE:
            return {
                ...state,
                [action.instanceID]: {
                    ...defaultInstanceState,
                    ...state[action.instanceID],
                    themeConfigs: action.themeConfigs,
                    fetchingConfigs: false
                }
            };
        case ALERT_MESSAGE:
            return {
                ...state,
                [action.instanceID]: {
                    ...defaultInstanceState,
                    ...state[action.instanceID],
                    alertMessage: action.alertMessage
                } };
        case TOGGLE_FETCHING_DATA:
            return {
                ...state,
                [action.instanceID]: {
                    ...defaultInstanceState,
                    ...state[action.instanceID],
                    fetchingData: action.fetchingData
                } };
        case FETCH_DATA_FAILED:
            return { ...state, [action.instanceID]: { ...state[action.instanceID], pieData: [] } };
        case UPDATE_DATA_FROM_FETCH:
            return {
                ...state,
                [action.instanceID]: {
                    ...defaultInstanceState,
                    ...state[action.instanceID],
                    data: action.data,
                    fetchingData: false,
                    layoutOptions: action.layoutOptions,
                    pieData: action.pieData && action.pieData.slice()
                }
            };
        case NO_CONTEXT:
            return {
                ...state,
                [action.instanceID]: {
                    ...state[action.instanceID],
                    ...defaultInstanceState,
                    updatingData: true,
                    themeConfigs: state[action.instanceID].themeConfigs
                } };
        case TOGGLE_UPDATING_DATA:
            return {
                ...state,
                [action.instanceID]: {
                    ...defaultInstanceState,
                    ...state[action.instanceID],
                    updatingData: action.updatingData
                } };
        case LOAD_PLAYGROUND:
            return {
                ...state,
                [action.instanceID]: {
                    ...defaultInstanceState,
                    ...state[action.instanceID],
                    playground: action.playground
                } };
        case UPDATE_DATA_FROM_PLAYGROUND:
            return {
                ...state,
                [action.instanceID]: {
                    ...defaultInstanceState,
                    ...state[action.instanceID],
                    layoutOptions: action.layoutOptions,
                    dataOptions: action.dataOptions,
                    configurationOptions: action.configurationOptions,
                    updatingData: true
                }
            };
        case CLEAR_INSTANCE_STATE:
            delete state[action.instanceID];

            return { ...state };
        default:
            return state;
    }
};

registerReducer({ pie: pieChartReducer });
