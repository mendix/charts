import chart from "./pages/area.page";

describe("Area chart", () => {
    beforeAll(() => {
        chart.open();
        browser.pause(3000);
    });

    it("should generate a chart", () => {
        chart.svgElement.waitForDisplayed();
        const isExist = chart.svgElement.isExisting();

        expect(isExist).toBeTruthy();
    });

    it("should be generated with two traces", () => {
        browser.waitUntil(() => {
            return chart.traces.map((elem) => elem.isDisplayed()).length > 1;
        });

        expect(chart.traces.map((elem) => elem.isDisplayed()).length).toBe(2);
    });
});
