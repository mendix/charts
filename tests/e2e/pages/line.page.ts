import { DefaultPage } from "./home.page";

class LineChart extends DefaultPage {

    public get svgElement() {
        return $(".mx-name-lineChart1 .js-plotly-plot svg");
    }

    public get traces() {
        return $$(".mx-name-lineChart1 .js-plotly-plot svg .infolayer .legend .groups .traces");
    }

    public get trace1() {
        return $(".mx-name-lineChart1 .js-plotly-plot svg .infolayer .legend .groups .traces");
    }

    public open(): void {
        browser.url("/p/line_area");
    }
}

const chart = new LineChart();
export default chart;
