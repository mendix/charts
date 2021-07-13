import chart from "./pages/default.page";

describe("Time series", () => {
    beforeAll(() => {
        chart.open();
    });

    it("should generate a chart", () => {
        chart.timeSeries.waitForDisplayed();
        const isExist = chart.timeSeries.isExisting();

        expect(isExist).toBeTruthy();
    });

    it("should be controlled by a range slider", () => {
        chart.miniSlider.waitForDisplayed();

        expect(chart.miniSlider.isExisting()).toBeTruthy();
    });
});
