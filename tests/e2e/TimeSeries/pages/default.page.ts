import { DefaultPage } from "../../DefaultPage/home.page";

class TimeSeries extends DefaultPage {

    public get timeSeries() {
        return browser.element(".mx-name-timeSeries1.js-plotly-plot svg");
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
