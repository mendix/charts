import heatMap from "./pages/default.page";

describe("Heat map", () => {
    beforeAll(() => {
        heatMap.open();
    });

    it("should generate a chart", () => {
        heatMap.heatMap.waitForVisible();
        const nodeName = heatMap.heatMap.getAttribute("nodeName");

        expect(nodeName).toBe("svg");
    });
});
