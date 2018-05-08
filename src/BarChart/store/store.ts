import { applyMiddleware, createStore } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";

import { barChartReducer } from "./BarChartReducer";
import { Container } from "../../utils/namespaces";

const loggerMiddleware = createLogger();
export const store = createStore<Container.BarChartContainerState, any, any, any>(
    barChartReducer,
    applyMiddleware(thunkMiddleware, loggerMiddleware)
);
