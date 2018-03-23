class AreaChart {

    public get svgElement() {
        return browser.element(".mx-name-areaChart1.js-plotly-plot");
    }

    public get series() {
        return browser.element(".mx-name-areaChart1.js-plotly-plot > div.plot-container.plotly > div > svg:nth-child(3) > g.infolayer > g.legend > g > g");
    }
}
const chart = new AreaChart();
export default chart;
