import heatMap from "./pages/default.page";

describe("Heat Map", () => {
    beforeAll(() => {
        heatMap.open();
    });

    it("should generate a chart", () => {
        heatMap.heatMap.waitForDisplayed();
        const innerHTML = heatMap.heatMap.getHTML(false);

        expect(innerHTML).toContain("svg");
    });
});
