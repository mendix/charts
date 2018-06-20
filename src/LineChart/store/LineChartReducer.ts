import { ScatterData } from "plotly.js";
import { Action, Reducer } from "redux";
import { Container, Data } from "../../utils/namespaces";
import { DefaultReduxStore, registerReducer } from "../../store";

import { SeriesPlayground } from "../../components/SeriesPlayground";
import LineChartContainerState = Container.LineChartContainerState;
import LineSeriesProps = Data.LineSeriesProps;

export type LineChartAction = Action & LineChartInstanceState & { widgetID: string };

export interface LineChartState {
    layoutOptions: string;
    series?: LineSeriesProps[];
    scatterData?: ScatterData[];
    seriesOptions?: string[];
    configurationOptions: string;
    themeConfigs: { layout: {}, configuration: {}, data: {} };
    playground?: typeof SeriesPlayground;
    hiddenTraces: number[];
}

export type LineChartInstanceState = LineChartContainerState & LineChartState;
export interface LineChartReducerState {
    [ widgetID: string ]: LineChartInstanceState;
}
export interface ScatterReduxStore extends DefaultReduxStore {
    scatter: LineChartReducerState;
}

const prefix = "ScatterChart";
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

const defaultDataState: Partial<LineChartInstanceState> = {
    data: [],
    fetchingData: false,
    scatterData: [],
    seriesOptions: []
};

export const defaultInstanceState: Partial<LineChartInstanceState> = {
    ...defaultDataState,
    alertMessage: "",
    fetchingConfigs: false,
    themeConfigs: { layout: {}, configuration: {}, data: {} }
};

const defaultState: Partial<LineChartInstanceState> = {};

export const scatterChartReducer: Reducer<LineChartReducerState> = (state = defaultState as LineChartReducerState, action: LineChartAction): LineChartReducerState => {
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
        case FETCH_THEME_CONFIGS_COMPLETE:
            return {
                ...state,
                [action.widgetID]: {
                    ...defaultInstanceState,
                    ...state[action.widgetID],
                    themeConfigs: action.themeConfigs,
                    fetchingConfigs: false
                }
            };
        case UPDATE_DATA_FROM_FETCH:
            return {
                ...state,
                [action.widgetID]: {
                    ...defaultInstanceState,
                    ...state[action.widgetID],
                    data: action.data && action.data.slice(),
                    layoutOptions: action.layoutOptions,
                    fetchingData: false,
                    scatterData: action.scatterData && action.scatterData.slice(),
                    seriesOptions: action.seriesOptions.slice()
                }
            };
        case FETCH_DATA_FAILED:
            return { ...state, [action.widgetID]: { ...state[action.widgetID], ...defaultDataState } };
        case NO_CONTEXT:
            return {
                ...state,
                [action.widgetID]: {
                    ...defaultInstanceState,
                    ...state[action.widgetID],
                    ...defaultDataState
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
                    ...state[action.widgetID],
                    layoutOptions: action.layoutOptions,
                    scatterData: action.scatterData && action.scatterData.slice(),
                    seriesOptions: action.seriesOptions.slice(),
                    configurationOptions: action.configurationOptions
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
        case RESET:
            return defaultState as LineChartReducerState;
        default:
            return state;
    }
};

registerReducer({ scatter: scatterChartReducer });
