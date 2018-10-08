import chart from "./pages/area.page";

describe("Area chart", () => {
    beforeAll(() => {
        chart.open();
        browser.pause(3000);
    });

    it("should generate a chart", () => {
        chart.svgElement.waitForVisible();
        const isExist = chart.svgElement.isExisting();

        expect(isExist).toBeTruthy();
    });

    it("should be generated with two traces", () => {
        chart.traces.waitForValue();

        expect(chart.traces.value.length).toBe(2);
    });
});
