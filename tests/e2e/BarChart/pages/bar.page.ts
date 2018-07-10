import { DefaultPage } from "../../DefaultPage/home.page";

class BarChart extends DefaultPage {

    public get svgElement() {
        return browser.element(".mx-name-barChart1 .js-plotly-plot svg");
    }

    public get traces() {
        return browser.elements(".mx-name-barChart1 .js-plotly-plot svg .infolayer .legend .groups .traces");
    }

    public get trace1() {
        return browser.element(".mx-name-barChart1 .js-plotly-plot svg .infolayer .legend .groups .traces");
    }
}
const chart = new BarChart();
export default chart;
