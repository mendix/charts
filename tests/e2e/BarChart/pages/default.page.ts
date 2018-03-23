class BarChart {

    public get svgElement() {
        return browser.element(".mx-name-barChart1.js-plotly-plot > div.plot-container.plotly > div > svg:nth-child(1)");
    }

    public get series() {
        return browser.element(".mx-name-barChart1.js-plotly-plot > div.plot-container.plotly > div > svg:nth-child(3) > g.infolayer > g.legend > g > g");
    }

    public get serie1() {
        return browser.element(".mx-name-barChart1.js-plotly-plot > div.plot-container.plotly > div > svg:nth-child(3) > g.infolayer > g.legend > g > g > g:nth-child(1)");
    }
}
const chart = new BarChart();
export default chart;
