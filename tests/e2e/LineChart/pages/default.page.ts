class LineChart {

    public get svgElement() {
        return browser.element(".mx-name-lineChart1.js-plotly-plot > div.plot-container.plotly > div > svg:nth-child(1)");
    }

    public get series() {
        return browser.element(".mx-name-lineChart1.js-plotly-plot > div.plot-container.plotly > div > svg:nth-child(3) > g.infolayer > g.legend > g > g");
    }

    public get serie1() {
        return browser.element(".mx-name-lineChart1.js-plotly-plot > div.plot-container.plotly > div > svg:nth-child(3) > g.infolayer > g.legend > g > g > g:nth-child(1)");
    }

    public open(): void {
        browser.url("/p/line_area");
    }
}

const chart = new LineChart();
export default chart;
