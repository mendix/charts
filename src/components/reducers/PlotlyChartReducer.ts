import { Config, HeatMapData, Layout, PieData, ScatterData } from "plotly.js";
import { Action, Reducer } from "redux";

export type PlotlyChartAction = Action & PlotlyChartState;

export interface ChartData {
    layout?: Partial<Layout>;
    data?: ScatterData[] | PieData[] | HeatMapData[];
    config?: Partial<Config>;
}
export interface PlotlyChartState extends ChartData {
    loadingAPI: boolean;
    loadingData: boolean;
}

const prefix = "PlotlyChart";
export const RESET = `${prefix}.RESET`;
export const TOGGLE_PLOTLY_API_LOADING = `${prefix}.TOGGLE_PLOTLY_API_LOADING`;
export const TOGGLE_PLOTLY_DATA_LOADING = `${prefix}.TOGGLE_PLOTLY_DATA_LOADING`;
export const UPDATE_DATA = `${prefix}.UPDATE_DATA`;

const defaultState: Partial<PlotlyChartState> = {
    loadingAPI: true
};

export const plotlyChartReducer: Reducer<PlotlyChartState> = (state = defaultState as PlotlyChartState, action: PlotlyChartAction): PlotlyChartState => {
    switch (action.type) {
        case UPDATE_DATA:
            return {
                ...state,
                loadingData: false,
                data: action.data,
                layout: action.layout,
                config: action.config
            };
        case TOGGLE_PLOTLY_API_LOADING:
            return { ...state, loadingAPI: !state.loadingAPI };
        case TOGGLE_PLOTLY_DATA_LOADING:
            return { ...state, loadingData: !state.loadingData };
        case RESET:
            return defaultState as PlotlyChartState;
        default:
            return state;
    }
};
