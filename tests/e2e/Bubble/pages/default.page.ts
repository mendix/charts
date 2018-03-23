class BubbleChart {

    public get bubble() {
        return browser.element(".mx-name-bubbleChart1.js-plotly-plot");
    }

    public open(): void {
        browser.url("/p/bubble");
    }
}
const chart = new BubbleChart();
export default chart;
