import { Action, Reducer } from "redux";
import { AnyChartPlayground } from "../components/AnyPlayground";
import { ReactChild } from "react";
import { DefaultReduxStore, registerReducer } from "../../store";

export type AnyChartAction = Action & AnyChartInstanceState & { widgetID: string };

export interface AnyChartInstanceState {
    playground?: typeof AnyChartPlayground;
    attributeData: string;
    attributeLayout: string;
    alertMessage?: ReactChild;
    fetchingData: boolean;
}

export interface AnyChartReducerState {
    [ widgetID: string ]: AnyChartInstanceState;
}

export interface AnyReduxStore extends DefaultReduxStore {
    any: AnyChartReducerState;
}

const prefix = "AnyChart";
export const ALERT_MESSAGE = `${prefix}.ALERT_MESSAGE`;
export const TOGGLE_FETCHING_DATA = `${prefix}.TOGGLE_FETCHING_DATA`;
export const UPDATE_DATA_FROM_FETCH = `${prefix}.UPDATE_DATA_FROM_FETCH`;
export const FETCH_DATA_FAILED = `${prefix}.FETCH_DATA_FAILED`;
export const NO_CONTEXT = `${prefix}.NO_CONTEXT`;
export const LOAD_PLAYGROUND = `${prefix}.LOAD_PLAYGROUND`;
export const UPDATE_DATA_FROM_PLAYGROUND = `${prefix}.UPDATE_DATA_FROM_PLAYGROUND`;

export const defaultInstanceState: Partial<AnyChartInstanceState> = {
    alertMessage: "",
    fetchingData: false
};

export const anyChartReducer: Reducer<AnyChartReducerState> = (state = {} as AnyChartReducerState, action: AnyChartAction): AnyChartReducerState => {
    switch (action.type) {
        case UPDATE_DATA_FROM_FETCH:
            return {
                ...state,
                [action.widgetID]: {
                    ...defaultInstanceState,
                    ...state[action.widgetID],
                    attributeData: action.attributeData,
                    attributeLayout: action.attributeLayout,
                    fetchingData: false
                }
            };
        case FETCH_DATA_FAILED:
            return { ...state, [action.widgetID]: { ...state[action.widgetID], ...defaultInstanceState } };
        case NO_CONTEXT:
            return {
                ...state,
                [action.widgetID]: {
                    ...defaultInstanceState,
                    ...state[action.widgetID],
                    ...defaultInstanceState
                } };
        case TOGGLE_FETCHING_DATA:
            return {
                ...state,
                [action.widgetID]: {
                    ...defaultInstanceState,
                    ...state[action.widgetID],
                    fetchingData: action.fetchingData
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
                    ...state[action.widgetID]
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
        default:
            return state;
    }
};

registerReducer({ any: anyChartReducer });
