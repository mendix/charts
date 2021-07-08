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

    it("should have at least 2 bubbles for each trace", () => {
        browser.waitUntil(() => {
            return chart.bubbles.map((elem) => elem.isDisplayed()).length > 1;
        });

        expect(chart.bubbles.map((elem) => elem.isDisplayed()).length).toBeGreaterThan(1);

    });
});
