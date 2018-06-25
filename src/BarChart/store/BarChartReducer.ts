import { ScatterData } from "plotly.js";
import { Action, Reducer } from "redux";
import { SeriesPlayground } from "../../components/SeriesPlayground";
import { DefaultReduxStore, registerReducer } from "../../store";
import { seriesReducer } from "../../store/Series_Reducer";
import { Container, Data } from "../../utils/namespaces";
import BarChartContainerState = Container.BarChartContainerState;

export type BarChartAction = Action & BarChartInstanceState & { widgetID: string };

export interface BarChartState {
    layoutOptions: string;
    series?: Data.SeriesProps[];
    seriesOptions?: string[];
    configurationOptions: string;
    themeConfigs: { layout: {}, configuration: {}, data: {} };
    scatterData?: ScatterData[];
    playground?: typeof SeriesPlayground;
    updatingData: boolean;
}

export type BarChartInstanceState = BarChartContainerState & BarChartState;
export interface BarChartReducerState {
    [ widgetID: string ]: BarChartInstanceState;
}

export interface BarReduxStore extends DefaultReduxStore {
    bar: BarChartReducerState;
}

export const barPrefix = "BarChart";

const defaultDataState: Partial<BarChartInstanceState> = {
    seriesData: [],
    fetchingData: false,
    scatterData: [],
    seriesOptions: []
};

export const defaultInstanceState: Partial<BarChartInstanceState> = {
    ...defaultDataState,
    alertMessage: "",
    fetchingConfigs: false,
    themeConfigs: { layout: {}, configuration: {}, data: {} }
};

export const barChartReducer: Reducer<BarChartReducerState> =
    seriesReducer<BarChartInstanceState, BarChartAction>(
        barPrefix,
        defaultInstanceState as BarChartInstanceState,
        defaultDataState as BarChartInstanceState
    );

registerReducer({ bar: barChartReducer });
