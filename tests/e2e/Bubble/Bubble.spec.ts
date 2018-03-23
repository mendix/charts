import defaultPage from "./../DefaultPage/default.page";
import chart from "./pages/default.page";

describe("Bubble chart", () => {
    beforeAll(() => {
        chart.open();
    });

    it("should generate a chart", () => {
        chart.bubble.waitForVisible();
        const isExist = chart.bubble.isExisting();

        expect(isExist).toBeTruthy();
    });
});
