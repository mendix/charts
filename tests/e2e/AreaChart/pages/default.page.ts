class DefaultFilter {

    public get checkBoxFilter() {
        return browser.element("#mxui_widget_ReactCustomWidgetWrapper_0 > input[type='checkbox']");
    }

    public get listView() { return browser.element("#mxui_widget_ListView_0"); }

    public get listViewItems() { return browser.elements("#mxui_widget_ListView_0 .mx-listview-item"); }

    public open(): void {
        browser.url("/p/checkboxfilter");
    }
}
const defaultFilter = new DefaultFilter();
export default defaultFilter;
