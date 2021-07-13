import chart from "./pages/default.page";

describe("Pie Chart", () => {
    beforeAll(() => {
        chart.open();
    });

    it("should generate a chart", () => {
        chart.pieChart.waitForExist();
        const exists = chart.pieChart.isExisting();

        expect(exists).toBeTruthy();
    });

    it("should have multiple slices", () => {
        browser.waitUntil(() => {
            return chart.slices.filter((elem) => elem.isDisplayed()).length > 1;
        });

        expect(chart.slices.filter((elem) => elem.isDisplayed()).length).toBeGreaterThan(1);

    });

});
