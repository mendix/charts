import chart from "./pages/default.page";

describe("Time series", () => {
    beforeAll(() => {
        chart.open();
    });

    it("should generate a chart", () => {
        chart.timeSeries.waitForVisible();
        const nodeName = chart.timeSeries.getAttribute("nodeName");

        expect(nodeName).toBe("svg");
    });

    it("should be controlled by a range slider", () => {
        chart.miniSlider.waitForVisible();

        expect(chart.miniSlider.isExisting()).toBeTruthy();
    });
});
