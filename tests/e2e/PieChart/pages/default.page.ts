class PieChart {

    public get pieChart() {
        return browser.element(".mx-name-pieChart1.js-plotly-plot");
    }

    public get slices() {
        return browser.elements(".mx-name-pieChart1.js-plotly-plot  svg .infolayer .legend .groups .traces");
    }

    public open(): void {
        browser.url("/p/pie");
    }
}

const chart = new PieChart();
export default chart;
