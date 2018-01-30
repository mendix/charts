import { createElement } from "react";
import { mount, shallow } from "enzyme";

import { getRandomNumbers } from "../utils/data";
import { ScatterData } from "plotly.js";
import * as Plotly from "../PlotlyCustom";

import { PlotlyChart, PlotlyChartProps } from "../components/PlotlyChart";

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

    xit("renders the structure correctly", () => {
        const chart = renderShallowPlotlyChart(defaultProps);

        expect(chart).toBeElement(
            createElement("div", { className: "widget-charts widget-charts-line" },
                createElement("div", { className: "widget-charts-tooltip" })
            )
        );
    });

    xit("renders the chart", () => {
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

    xit("purges and re-renders the chart on resize", (done) => {
        // since we cannot simulate element resize, we shall only test for the expected behaviour of the onResize function
        const renderChartSpy = spyOn(PlotlyChart.prototype, "renderChart" as any).and.callThrough();
        const purgeSpy = spyOn(Plotly, "purge" as any).and.callThrough();
        const chart = renderFullPlotlyChart(defaultProps);
        (chart.instance() as any).onResize();

        setTimeout(() => {
            expect(purgeSpy).toHaveBeenCalled();
            expect(renderChartSpy).toHaveBeenCalledTimes(2);

            done();
        }, 1000);
    });

    it("re-renders the chart on update", () => {
        const renderChartSpy = spyOn(PlotlyChart.prototype, "renderChart" as any).and.callThrough();
        const chart = renderFullPlotlyChart(defaultProps);
        chart.setProps({ onClick: jasmine.createSpy("onClick") });

        expect(renderChartSpy).toHaveBeenCalledTimes(2);
    });

    xit("destroys the chart on unmount", () => {
        const purgeSpy = spyOn(Plotly, "purge" as any).and.callThrough();
        const chart = renderFullPlotlyChart(defaultProps);
        chart.unmount();

        expect(purgeSpy).toHaveBeenCalled();
    });

    it("passes a reference of the tooltip node to the parent component", () => {
        defaultProps.getTooltipNode = jasmine.createSpy("getTooltip");
        renderFullPlotlyChart(defaultProps);

        expect(defaultProps.getTooltipNode).toHaveBeenCalled();
    });

    it("hides the tooltip when a hover event is undone", () => {
        // since we cannot simulate plotly unhover, we shall only test for the expected behaviour of the clearTooltip function
        const chart = renderFullPlotlyChart(defaultProps);
        const chartInstance: any = chart.instance();
        chartInstance.tooltipNode.innerHTML = "I am a tooltip";
        chartInstance.tooltipNode.style.opacity = "1";
        chartInstance.clearTooltip();

        expect(chartInstance.tooltipNode.innerHTML).toEqual("");
        expect(chartInstance.tooltipNode.style.opacity).toEqual("0");
    });
});
