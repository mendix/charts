import chart from "./pages/default.page";

describe("Polar chart", () => {
    beforeAll(() => {
        chart.open();
    });

    xit("should generate a chart", () => {
        chart.polar.waitForVisible();
        const nodeName = chart.polar.getAttribute("nodeName");

        expect(nodeName).toBe("svg");
    });

    xit("should be generated with two traces", () => {
        chart.traces.waitForValue();

        expect(chart.traces.value.length).toBe(2);
    });

    // with other drivers apart from chrome it does not autoscroll to the element in overflow:auto block
    xit("should hide a line serie when a serie toggle item is clicked", () => {
        chart.trace1.waitForVisible();
        chart.trace1.click();
        const serie1 = chart.trace1.getCssProperty("opacity");
        chart.trace1.waitForValue();
        const value = Number(serie1.value);

        expect(value).toBe(0.5);
    });
});
