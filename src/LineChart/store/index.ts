import { applyMiddleware, combineReducers, createStore } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";

import { LineChartReducerState, scatterChartReducer } from "./LineChartReducer";
import { PlotlyChartState, plotlyChartReducer } from "../../components/reducers/PlotlyChartReducer";

// NB: activate redux-logger if you need to examine the state data in the console, or you aren't testing on Chrome
const loggerMiddleware = createLogger();
export const store = createStore(
    combineReducers({ scatter: scatterChartReducer, plotly: plotlyChartReducer }),
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
    applyMiddleware(thunkMiddleware, loggerMiddleware)
);

export interface ReduxStore {
    scatter: LineChartReducerState;
    plotly: PlotlyChartState;
}
