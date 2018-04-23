import chart from "./pages/default.page";

describe("Bubble chart", () => {
    beforeAll(() => {
        chart.open();
    });

    it("should generate a chart", () => {
        chart.bubble.waitForExist();
        const isExist = chart.bubble.isExisting();

        expect(isExist).toBeTruthy();
    });

    it("should have atleast 2 bubbles for each trace", () => {
        chart.bubbles.waitForVisible();

        expect(chart.bubbles.value.length).toBeGreaterThan(1);
    });
});
