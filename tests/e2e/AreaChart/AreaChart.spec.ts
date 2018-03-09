import defaultPage from "./../DefaultPage/default.page";
import chart from "./pages/default.page";

describe("Area chart", () => {
    beforeAll(() => {
        defaultPage.open();
    });

    it("should generate a chart", () => {
        chart.svgElement.waitForVisible();
        const isExist = chart.svgElement.isExisting();

        expect(isExist).toBeTruthy();
    });

    it("should be generated with two series", () => {
        const series = chart.series.getAttribute("childElementCount");

        expect(series).toBe("2");
    });
});
