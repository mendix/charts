import defaultFilter from "./pages/default.page";

describe("Heat map", () => {
    beforeAll(() => {
        defaultFilter.open();
    });

    it("should generate a chart", () => {
        defaultFilter.heatMap.waitForVisible();
        const nodeName = defaultFilter.heatMap.getAttribute("nodeName");

        expect(nodeName).toBe("svg");
    });
});
