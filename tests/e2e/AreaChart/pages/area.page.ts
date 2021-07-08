import { DefaultPage } from "../../DefaultPage/home.page";

class AreaChart extends DefaultPage {

    public get svgElement() {
        return $(".mx-name-areaChart1 .js-plotly-plot");
    }

    public get traces() {
        return $$(".mx-name-areaChart1 .js-plotly-plot svg .legend .groups .traces");
    }
}
const chart = new AreaChart();
export default chart;
