import defaultPage from "./../DefaultPage/default.page";
import chart from "./pages/default.page";

describe("Bar chart", () => {
    beforeAll(() => {
        defaultPage.open();
    });

    it("should generate a chart", () => {
        chart.svgElement.waitForVisible();
        const nodeName = chart.svgElement.getAttribute("nodeName");

        expect(nodeName).toBe("svg");
    });

    it("should generated with two bar series", () => {
        const series = chart.series.getAttribute("childElementCount");

        expect(series).toBe("2");
    });

    it("should hide a bar serie when a serie toggle item is clicked", () => {
        chart.serie1.click();
        const serie1 = chart.serie1.getCssProperty("opacity");
        chart.serie1.waitForValue();
        const value = Number(serie1.value);

        expect(value).toBe(0.5);
    });
});
