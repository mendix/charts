import { DefaultPage } from "../../DefaultPage/home.page";

class LineChart extends DefaultPage {

    public get svgElement() {
        return browser.element(".mx-name-lineChart1 .js-plotly-plot svg");
    }

    public get traces() {
        return browser.elements(".mx-name-lineChart1 .js-plotly-plot svg .infolayer .legend .groups .traces");
    }

    public get trace1() {
        return browser.element(".mx-name-lineChart1 .js-plotly-plot svg .infolayer .legend .groups .traces");
    }

    public open(): void {
        browser.url("/p/line_area");
    }
}

const chart = new LineChart();
export default chart;
