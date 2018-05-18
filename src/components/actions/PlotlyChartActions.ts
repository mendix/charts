import { ChartData, RESET, TOGGLE_PLOTLY_API_LOADING, TOGGLE_PLOTLY_DATA_LOADING, UPDATE_DATA } from "../reducers/PlotlyChartReducer";

export const resetState = () => ({  type: RESET });
export const togglePlotlyAPILoading = () => ({ type: TOGGLE_PLOTLY_API_LOADING });
export const togglePlotlyDataLoading = () => ({ type: TOGGLE_PLOTLY_DATA_LOADING });
export const updateData = (data: ChartData) => ({ type: UPDATE_DATA, ...data });
