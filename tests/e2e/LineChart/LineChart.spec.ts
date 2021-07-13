import chart from "./pages/default.page";

describe("Line chart", () => {
    beforeAll(() => {
        chart.open();
    });

    it("should generate a chart", () => {
        chart.svgElement.waitForExist();
        const isExist = chart.svgElement.isExisting();

        expect(isExist).toBeTruthy();
    });

    it("should be generated with two traces", () => {
        browser.waitUntil(() => {
            return chart.traces.map((elem) => elem.isDisplayed()).length > 1;
        });
        expect(chart.traces.map((elem) => elem.isDisplayed()).length).toBe(2);
    });

    // TO DO: With other drivers apart from chrome it does not autoscroll to the element in overflow:auto block
    xit("should hide a line series when a trace toggle item is clicked", () => {
        chart.trace1.waitForExist();
        chart.trace1.click();

        browser.waitUntil(() => {
            const serie1 = chart.trace1.getCSSProperty("opacity");
            const value = Number(serie1.value);

            return value === 0.5;
        }, 1000, "expected trace to hide with value 0.5");
    });
});
