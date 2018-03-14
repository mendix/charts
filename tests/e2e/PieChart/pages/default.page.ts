class PieChart {

    public get pieChart() {
        return browser.element(".mx-name-pieChart1.js-plotly-plot");
    }

    public get pieLayer() {
        return browser.element(".mx-name-pieChart1.js-plotly-plot > div.plot-container.plotly > div > svg:nth-child(1) > g.pielayer > g");
    }

    public open(): void {
        browser.url("/p/pie");
    }
}

const chart = new PieChart();
export default chart;
