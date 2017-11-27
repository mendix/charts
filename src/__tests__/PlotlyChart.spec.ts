import { createElement } from "react";
import { mount, shallow } from "enzyme";

import { getRandomNumbers } from "../utils/data";
import { ScatterData } from "plotly.js";
import * as Plotly from "../PlotlyCustom";

import { PlotlyChart, PlotlyChartProps } from "../components/PlotlyChart";
import createSpy = jasmine.createSpy;

describe("PlotlyChart", () => {
    const renderShallowPlotlyChart = (props: PlotlyChartProps) => shallow(createElement(PlotlyChart, props));
    const renderFullPlotlyChart = (props: PlotlyChartProps) => mount(createElement(PlotlyChart, props));
    const defaultProps: PlotlyChartProps = {
        type: "line",
        layout: {
            title: "My Chart",
            showlegend: true
        },
        data: [
            {
                x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ],
                y: getRandomNumbers(4, 100)
            } as ScatterData
        ],
        config: { displayModeBar: false, doubleClick: false }
    };

    it("renders the structure correctly", () => {
        const chart = renderShallowPlotlyChart(defaultProps);

        expect(chart).toBeElement(
            createElement("div", { className: "widget-charts widget-charts-line" },
                createElement("div", { className: "widget-charts-tooltip" })
            )
        );
    });

    it("renders the chart", () => {
        const renderChartSpy = spyOn(PlotlyChart.prototype, "renderChart" as any).and.callThrough();
        const plotlySpy = spyOn(Plotly, "newPlot").and.callThrough();
        renderFullPlotlyChart(defaultProps);

        expect(renderChartSpy).toHaveBeenCalledWith(defaultProps);
        expect(plotlySpy).toHaveBeenCalled();
    });

    it("listens for resize events", () => {
        const resizeListenerSpy = spyOn(PlotlyChart.prototype, "addResizeListener" as any).and.callThrough();
        renderFullPlotlyChart(defaultProps);

        expect(resizeListenerSpy).toHaveBeenCalled();
    });

    it("re-renders the chart on update", () => {
        const renderChartSpy = spyOn(PlotlyChart.prototype, "renderChart" as any).and.callThrough();
        const chart = renderFullPlotlyChart(defaultProps);
        chart.setProps({ onClick: createSpy("onClick") });

        expect(renderChartSpy).toHaveBeenCalledTimes(2);
    });
});
