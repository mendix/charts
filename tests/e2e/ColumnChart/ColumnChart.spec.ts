import chart from "./pages/default.page";

describe("Column chart", () => {
    beforeAll(() => {
        chart.open();
    });

    it("should generate a chart", () => {
        chart.svgElement.waitForExist();
        const isExist = chart.svgElement.isExisting();

        expect(isExist).toBeTruthy();
    });

    it("should be generated with two traces", () => {
        chart.traces.waitForValue();

        expect(chart.traces.value.length).toBe(2);
    });

    // with other drivers apart from chrome it does not autoscroll to the element in overflow:auto block
    it("should hide a column when a trace toggle item is clicked", () => {
        chart.trace1.waitForExist();
        chart.trace1.click();

        browser.waitUntil(() => {
            const serie1 = chart.trace1.getCssProperty("opacity");
            const value = Number(serie1.value);

            return value === 0.5;
        }, 1000, "expected trace to hide with value 0.5");
    });
});
