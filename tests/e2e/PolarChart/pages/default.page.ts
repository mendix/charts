import { DefaultPage } from "../../DefaultPage/home.page";

class PolarChart extends DefaultPage {

    public get polar() {
        return browser.element(".mx-name-polarChart1 .js-plotly-plot");
    }

    public get traces() {
        return browser.elements(".mx-name-polarChart1 .js-plotly-plot svg .legend .groups .traces .traces");
    }

    public get trace1() {
        return browser.element(".mx-name-polarChart1 .js-plotly-plot svg .legend .groups .traces .traces");
    }
}

const chart = new PolarChart();
export default chart;
