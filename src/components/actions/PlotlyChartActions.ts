import {
    ChartData,
    INITIALISE_PLOTLY_INSTANCE,
    Plotly,
    RESET,
    TOGGLE_PLOTLY_API_LOADING,
    TOGGLE_PLOTLY_DATA_LOADING,
    UPDATE_DATA
} from "../reducers/PlotlyChartReducer";

export const resetState = () => ({  type: RESET });
export const initialiseInstanceState = (widgetID: string) => ({ type: INITIALISE_PLOTLY_INSTANCE, widgetID });
export const togglePlotlyAPILoading = (widgetID: string, plotly?: Plotly) =>
    ({ type: TOGGLE_PLOTLY_API_LOADING, widgetID, plotly });
export const togglePlotlyDataLoading = (widgetID: string) => ({ type: TOGGLE_PLOTLY_DATA_LOADING, widgetID });
export const updateData = (widgetID: string, data: ChartData) => ({ type: UPDATE_DATA, widgetID, ...data });
