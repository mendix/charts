import { Config, Data, HeatMapData, Layout, PieData, PlotlyHTMLElement, Root, ScatterData } from "plotly.js";
import { Action, Reducer } from "redux";

export type PlotlyChartAction = Action & PlotlyChartInstanceState & { widgetID: string };

export interface ChartData {
    layout?: Partial<Layout>;
    data?: ScatterData[] | PieData[] | HeatMapData[];
    config?: Partial<Config>;
}
export interface PlotlyChartInstanceState extends ChartData {
    loadingAPI: boolean;
    loadingData: boolean;
    plotly?: Plotly;
}

export interface PlotlyChartState {
    [ widgetID: string ]: PlotlyChartInstanceState;
}

export interface Plotly {
    newPlot: (root: Root, data: Data[], layout?: Partial<Layout>, config?: Partial<Config>) => Promise<PlotlyHTMLElement>;
    purge: (root: Root) => void;
    relayout?: (root: Root, layout: Partial<Layout>) => Promise<PlotlyHTMLElement>;
}

const prefix = "PlotlyChart";
export const RESET = `${prefix}.RESET`;
export const INITIALISE_PLOTLY_INSTANCE = `${prefix}.INITIALISE_PLOTLY_INSTANCE`;
export const TOGGLE_PLOTLY_API_LOADING = `${prefix}.TOGGLE_PLOTLY_API_LOADING`;
export const TOGGLE_PLOTLY_DATA_LOADING = `${prefix}.TOGGLE_PLOTLY_DATA_LOADING`;
export const UPDATE_DATA = `${prefix}.UPDATE_DATA`;

export const defaultPlotlyInstanceState: Partial<PlotlyChartInstanceState> = {
    loadingAPI: true
};
const defaultState: Partial<PlotlyChartState> = {};

export const plotlyChartReducer: Reducer<PlotlyChartState> = (state = defaultState as PlotlyChartState, action: PlotlyChartAction): PlotlyChartState => {
    switch (action.type) {
        case UPDATE_DATA:
            return {
                ...state,
                [action.widgetID]: {
                    ...state[action.widgetID],
                    loadingData: false,
                    data: action.data,
                    layout: action.layout,
                    config: action.config
                }
            };
        case TOGGLE_PLOTLY_API_LOADING:
            return {
                ...state,
                [action.widgetID]: {
                    ...state[action.widgetID],
                    loadingAPI: !state[action.widgetID].loadingAPI,
                    plotly: action.plotly
                }
            };
        case TOGGLE_PLOTLY_DATA_LOADING:
            return { ...state, [action.widgetID]: { ...state[action.widgetID], loadingData: !state[action.widgetID].loadingData } };
        case INITIALISE_PLOTLY_INSTANCE:
            return { ...state, [action.widgetID]: defaultPlotlyInstanceState as PlotlyChartInstanceState };
        case RESET:
            return defaultState as PlotlyChartState;
        default:
            return state;
    }
};
