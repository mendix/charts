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
        chart.slices.waitForExist();

        expect(chart.slices.value.length).toBeGreaterThan(1);
    });

});
