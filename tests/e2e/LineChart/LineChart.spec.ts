import chart from "./pages/default.page";

describe("Line chart", () => {
    beforeAll(() => {
        chart.open();
    });

    it("should generate a chart", () => {
        chart.svgElement.waitForVisible();
        const nodeName = chart.svgElement.getAttribute("nodeName");

        expect(nodeName).toBe("svg");
    });

    it("should be generated with two line series", () => {
        const series = chart.series.getAttribute("childElementCount");

        expect(series).toBe("2");
    });

    // with other drivers apart from chrome it does not autoscroll to the element in overflow:auto block
    it("should hide a line serie when a serie toggle item is clicked", () => {
        chart.serie1.click();
        const serie1 = chart.serie1.getCssProperty("opacity");
        chart.serie1.waitForValue();
        const value = Number(serie1.value);

        expect(value).toBe(0.5);
    });
});
