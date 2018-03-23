class TimeSeries {

    public get timeSeries() {
        return browser.element(".mx-name-timeSeries1.js-plotly-plot > div.plot-container.plotly > div > svg:nth-child(1)");
    }

    public get miniSlider() {
        return browser.element(".rangeslider-grabber-min");
    }

    public open(): void {
        browser.url("/p/timeseries");
    }
}

const chart = new TimeSeries();
export default chart;
