import { DefaultPage } from "../../DefaultPage/home.page";

class BubbleChart extends DefaultPage {

    public get bubble() {
        return $(".mx-name-bubbleChart1 .js-plotly-plot");
    }

    public get bubbles() {
        return $$(".mx-name-bubbleChart1 .js-plotly-plot svg .cartesianlayer .plot .scatterlayer .trace");
    }
    public open(): void {
        browser.url("/p/bubble");
    }
}
const chart = new BubbleChart();
export default chart;
