import { ScatterData } from "plotly.js";
import { Action, Reducer } from "redux";
import { SeriesPlayground } from "../../components/SeriesPlayground";
import { Container, Data } from "../../utils/namespaces";
import BarChartContainerState = Container.BarChartContainerState;

export type BarChartAction = Action & BarChartReducerState;

export interface BarChartState {
    layoutOptions: string;
    series?: Data.SeriesProps[];
    seriesOptions?: string[];
    configurationOptions: string;
    themeConfigs: { layout: {}, configuration: {}, data: {} };
    scatterData?: ScatterData[];
    playground?: typeof SeriesPlayground;
}

export type BarChartReducerState = BarChartContainerState & BarChartState;

const prefix = "BarChart";
export const RESET = `${prefix}.RESET`;
export const ALERT_MESSAGE = `${prefix}.ALERT_MESSAGE`;
export const IS_LOADING = `${prefix}.IS_LOADING`;
export const UPDATE_DATA_FROM_FETCH = `${prefix}.UPDATE_DATA_FROM_FETCH`;
export const FETCH_DATA_FAILED = `${prefix}.FETCH_DATA_FAILED`;
export const LOAD_PLAYGROUND = `${prefix}.LOAD_PLAYGROUND`;
export const UPDATE_DATA_FROM_PLAYGROUND = `${prefix}.UPDATE_DATA_FROM_PLAYGROUND`;
export const FETCH_THEME_CONFIGS = `${prefix}.FETCH_THEME_CONFIGS`;
export const FETCH_THEME_CONFIGS_COMPLETE = `${prefix}.FETCH_THEME_CONFIGS_COMPLETE`;

const defaultState: Partial<BarChartReducerState> = {
    alertMessage: "",
    loading: true,
    fetchingConfigs: false,
    seriesOptions: [],
    configurationOptions: "",
    themeConfigs: { layout: {}, configuration: {}, data: {} }
};

export const barChartReducer: Reducer<BarChartReducerState> = (state = defaultState as BarChartReducerState, action: BarChartAction): BarChartReducerState => {
    switch (action.type) {
        case FETCH_THEME_CONFIGS:
            return { ...state, fetchingConfigs: false, loading: true };
        case FETCH_THEME_CONFIGS_COMPLETE:
            return { ...state, themeConfigs: action.themeConfigs, fetchingConfigs: false };
        case UPDATE_DATA_FROM_FETCH:
            return {
                ...state,
                data: action.data,
                layoutOptions: action.layoutOptions,
                loading: false,
                scatterData: action.scatterData,
                seriesOptions: action.seriesOptions
            };
        case FETCH_DATA_FAILED:
            return {
                ...state,
                data: [],
                layoutOptions: action.layoutOptions,
                loading: false,
                scatterData: [],
                seriesOptions: []
            };
        case IS_LOADING:
            return { ...state, loading: action.loading };
        case LOAD_PLAYGROUND:
            return { ...state, playground: action.playground };
        case UPDATE_DATA_FROM_PLAYGROUND:
            return {
                ...state,
                layoutOptions: action.layoutOptions,
                scatterData: action.scatterData,
                seriesOptions: action.seriesOptions,
                configurationOptions: action.configurationOptions
            };
        case ALERT_MESSAGE:
            return { ...state, alertMessage: action.alertMessage };
        case RESET:
            return defaultState as BarChartReducerState;
        default:
            return state;
    }
};
