import chart from "./pages/default.page";

describe("Pie Chart", () => {
    let originalTimeout: number;
    beforeAll(() => {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

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

    afterAll(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
});
