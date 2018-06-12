import deepMerge from "deepmerge";
import { PieChartProps } from "../components/PieChart";
import { Layout, PieData } from "plotly.js";
import { configs } from "../../utils/configs";

export const getDefaultLayoutOptions = (props: PieChartProps): Partial<Layout> => {
    const defaultConfigs: Partial<Layout> = {
        font: {
            color: "#FFF",
            size: 12
        },
        showlegend: props.showLegend,
        legend: {
            font: {
                family: "Open Sans",
                size: 14,
                color: "#555"
            }
        },
        margin: {
            t: 10
        }
    };

    return deepMerge.all([ configs.layout, defaultConfigs ]);
};

export const getDefaultDataOptions = (props: PieChartProps): Partial<PieData> => {
    return {
        hole: props.chartType === "donut" ? 0.4 : 0,
        hoverinfo: "none",
        type: "pie",
        sort: false
    };
};
