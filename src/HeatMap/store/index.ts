import { applyMiddleware, combineReducers, createStore } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";

import { HeatMapReducerState, heatmapReducer } from "./HeatMapReducer";
import { PlotlyChartState, plotlyChartReducer } from "../../components/reducers/PlotlyChartReducer";

// NB: activate redux-logger if you need to examine the state data in the console, or you aren't testing on Chrome
const loggerMiddleware = createLogger();
export const store = createStore(
    combineReducers({ heatmap: heatmapReducer, plotly: plotlyChartReducer }),
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
    applyMiddleware(thunkMiddleware, loggerMiddleware)
);

export interface ReduxStore {
    heatmap: HeatMapReducerState;
    plotly: PlotlyChartState;
}
