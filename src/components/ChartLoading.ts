import { SFC, createElement } from "react";
import "../ui/ChartsLoading.scss";

export const ChartLoading: SFC<{ text: string }> = ({ text }) =>
    createElement("div", { className: "widget-charts-loading-wrapper" },
        createElement("div", { className: "widget-charts-loading" },
            createElement("div", { className: "widget-charts-loading-bar bar-one" }),
            createElement("div", { className: "widget-charts-loading-bar bar-two" }),
            createElement("div", { className: "widget-charts-loading-bar bar-three" }),
            createElement("div", { className: "widget-charts-loading-bar bar-four" }),
            createElement("div", { className: "widget-charts-loading-bar bar-five" }),
            createElement("div", { className: "widget-charts-loading-bar bar-six" }),
            createElement("div", { className: "widget-charts-loading-bar bar-seven" })
        ),
        createElement("div", { className: "widget-charts-loading-text" }, text)
    );
