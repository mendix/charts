import chart from "./pages/area.page";

describe("Area chart", () => {
    beforeAll(() => {
        chart.open();
    });

    it("should generate a chart", () => {
        chart.svgElement.waitForVisible();
        browser.pause(10000);
        const isExist = chart.svgElement.isExisting();

        expect(isExist).toBeTruthy();
    });

    it("should be generated with two traces", () => {
        chart.traces.waitForValue();
        browser.pause(10000);

        expect(chart.traces.value.length).toBe(2);
    });
});
