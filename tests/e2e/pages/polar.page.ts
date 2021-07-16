import { DefaultPage } from "./home.page";

class PolarChart extends DefaultPage {

    public get polar() {
        return $(".mx-name-polarChart1 .js-plotly-plot");
    }

    public get traces() {
        return $$(".mx-name-polarChart1 .js-plotly-plot svg .legend .groups .traces .traces");
    }

    public get trace1() {
        return $(".mx-name-polarChart1 .js-plotly-plot svg .legend .groups .traces .traces");
    }
}

const chart = new PolarChart();
export default chart;
