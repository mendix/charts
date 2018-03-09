import chart from "./pages/default.page";

describe("Pie chart", () => {
    beforeAll(() => {
        chart.open();
    });

    it("should generate a chart", () => {
        chart.pieChart.waitForExist();
        const exists = chart.pieChart.isExisting();

        expect(exists).toBeTruthy();
    });

    it("should have multiple slices", () => {
        chart.pieLayer.waitForVisible();
        const slices = chart.pieLayer.getAttribute("childElementCount");

        expect(slices).toBe("10");
    });
});
