class DefaultFilter {

    public get heatMap() {
        return browser.element(".mx-name-heatMap1.js-plotly-plot > div.plot-container.plotly > div > svg:nth-child(1)");
    }

    public open(): void {
        browser.url("/p/heatmap");
    }
}

const defaultFilter = new DefaultFilter();
export default defaultFilter;
