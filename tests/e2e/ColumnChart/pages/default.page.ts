import { DefaultPage } from "../../DefaultPage/home.page";

class ColumnChart extends DefaultPage {

    public get svgElement() {
        return browser.element(".mx-name-columnChart1 .js-plotly-plot svg");
    }

    public get traces() {
        return browser.elements(".mx-name-columnChart1 .js-plotly-plot svg .infolayer .legend .groups .traces");
    }

    public get trace1() {
        return browser.element(".mx-name-columnChart1 .js-plotly-plot svg .infolayer .legend .groups .traces");
    }
}
const chart = new ColumnChart();
export default chart;
