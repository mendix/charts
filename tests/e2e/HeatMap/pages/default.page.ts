import { DefaultPage } from "../../DefaultPage/home.page";

class HeatMap extends DefaultPage {

    get heatMap() {
        return browser.element(".mx-name-heatMap1 .js-plotly-plot svg");
    }

    open(): void {
        browser.url("/p/heatmap");
    }
}

const heatMap = new HeatMap();
export default heatMap;
