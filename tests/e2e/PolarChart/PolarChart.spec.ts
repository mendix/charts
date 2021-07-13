import chart from "./pages/default.page";

// TO DO: Check why we're skipping this spec

xdescribe("Polar chart", () => {
    beforeAll(() => {
        chart.open();
    });

    xit("should generate a chart", () => {
        chart.polar.waitForDisplayed();
        const nodeName = chart.polar.getAttribute("nodeName");

        expect(nodeName).toBe("svg");
    });

    xit("should be generated with two traces", () => {
        browser.waitUntil(() => {
            return chart.traces.map((elem) => elem.isDisplayed()).length > 1;
        });
        expect(chart.traces.map((elem) => elem.isDisplayed()).length).toBe(2);
    });

    // TO DO: with other drivers apart from chrome it does not autoscroll to the element in overflow:auto block
    xit("should hide a line serie when a serie toggle item is clicked", () => {
        chart.trace1.waitForDisplayed();
        chart.trace1.click();
        const serie1 = chart.trace1.getCSSProperty("opacity");
        chart.trace1.waitForDisplayed();
        const value = Number(serie1.value);

        expect(value).toBe(0.5);
    });
});
