import { ScatterData } from "plotly.js";
import { Action } from "redux";
import { Container, Data } from "../../utils/namespaces";
import { DefaultReduxStore, registerReducer } from "../../store";

import { SeriesPlayground } from "../../components/SeriesPlayground";
import { seriesReducer } from "../../store/SeriesReducer";
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
    updatingData: boolean;
}

export type LineChartInstanceState = LineChartContainerState & LineChartState;
export interface LineChartReducerState {
    [ widgetID: string ]: LineChartInstanceState;
}
export interface ScatterReduxStore extends DefaultReduxStore {
    scatter: LineChartReducerState;
}

export const scatterPrefix = "ScatterChart";

const defaultDataState: Partial<LineChartInstanceState> = {
    seriesData: [],
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

export const scatterChartReducer = seriesReducer<LineChartInstanceState, LineChartAction>(
    scatterPrefix,
    defaultInstanceState as LineChartInstanceState,
    defaultDataState as LineChartInstanceState
);

registerReducer({ scatter: scatterChartReducer });
