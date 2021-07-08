import { DefaultPage } from "../../DefaultPage/home.page";

class ColumnChart extends DefaultPage {

    public get svgElement() {
        return $(".mx-name-columnChart1 .js-plotly-plot svg");
    }

    public get traces() {
        return $$(".mx-name-columnChart1 .js-plotly-plot svg .infolayer .legend .groups .traces");
    }

    public get trace1() {
        return $(".mx-name-columnChart1 .js-plotly-plot svg .infolayer .legend .groups .traces");
    }
}
const chart = new ColumnChart();
export default chart;
