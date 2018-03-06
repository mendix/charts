class DefaultFilter {

    public get getAreaChart() {
        return browser.element("#mxui_widget_ReactCustomWidgetWrapper_3 > div.widget-charts.widget-charts-line.mx-name-areaChart1.js-plotly-plot");
    }

    public open(): void {
        browser.url("/p/home");
    }
}
const defaultFilter = new DefaultFilter();
export default defaultFilter;
