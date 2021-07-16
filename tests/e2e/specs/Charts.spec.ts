import areaChart from "../pages/area.page";
import barChart from "../pages/bar.page";
import columnChart from "../pages/column.page";
import lineChart from "../pages/line.page";
import pieChart from "../pages/pie.page";
import polarChart from "../pages/polar.page";
import bubbleChart from "../pages/bubble.page";

describe("Area chart", () => {
    beforeAll(() => {
        areaChart.open();
        browser.pause(3000);
    });

    it("should generate a chart", () => {
        areaChart.svgElement.waitForDisplayed();
        const isExist = areaChart.svgElement.isExisting();

        expect(isExist).toBeTruthy();
    });

    it("should be generated with two traces", () => {
        browser.waitUntil(() => {
            return areaChart.traces.filter((elem) => elem.isDisplayed()).length > 1;
        });

        expect(areaChart.traces.filter((elem) => elem.isDisplayed()).length).toBe(2);
    });
});

describe("Bar chart", () => {
    beforeAll(() => {
        barChart.open();
    });

    it("should generate a chart", () => {
        barChart.svgElement.waitForExist();
        const isExist = barChart.svgElement.isExisting();

        expect(isExist).toBeTruthy();
    });

    it("should be generated with two traces", () => {
        browser.waitUntil(() => {
            return barChart.traces.map((elem) => elem.isDisplayed()).length > 1;
        });
        expect(barChart.traces.map((elem) => elem.isDisplayed()).length).toBe(2);
    });

    // TO DO: with other drivers apart from chrome it does not autoscroll to the element in overflow:auto block
    xit("should hide a bar serie when a serie toggle item is clicked", () => {
        barChart.trace1.waitForExist();
        barChart.trace1.click();

        browser.waitUntil(() => {
            const serie1 = barChart.trace1.getCSSProperty("opacity");
            const value = Number(serie1.value);

            return value === 0.5;
        }, 1000, "expected trace to hide with value 0.5");
    });
});

describe("Column chart", () => {
    beforeAll(() => {
        columnChart.open();
    });

    it("should generate a chart", () => {
        columnChart.svgElement.waitForExist();
        const isExist = columnChart.svgElement.isExisting();

        expect(isExist).toBeTruthy();
    });

    it("should be generated with two traces", () => {
        browser.waitUntil(() => {
            return columnChart.traces.map((elem) => elem.isDisplayed()).length > 1;
        });
        expect(columnChart.traces.map((elem) => elem.isDisplayed()).length).toBe(2);
    });

    // TO DO: with other drivers apart from chrome it does not autoscroll to the element in overflow:auto block
    xit("should hide a column when a trace toggle item is clicked", () => {
        columnChart.trace1.waitForExist();
        columnChart.trace1.click();

        browser.waitUntil(() => {
            const serie1 = columnChart.trace1.getCSSProperty("opacity");
            const value = Number(serie1.value);

            return value === 0.5;
        }, 1000, "expected trace to hide with value 0.5");
    });
});

describe("Line chart", () => {
    beforeAll(() => {
        lineChart.open();
    });

    it("should generate a chart", () => {
        lineChart.svgElement.waitForExist();
        const isExist = lineChart.svgElement.isExisting();

        expect(isExist).toBeTruthy();
    });

    it("should be generated with two traces", () => {
        browser.waitUntil(() => {
            return lineChart.traces.map((elem) => elem.isDisplayed()).length > 1;
        });
        expect(lineChart.traces.map((elem) => elem.isDisplayed()).length).toBe(2);
    });

    // TO DO: With other drivers apart from chrome it does not autoscroll to the element in overflow:auto block
    xit("should hide a line series when a trace toggle item is clicked", () => {
        lineChart.trace1.waitForExist();
        lineChart.trace1.click();

        browser.waitUntil(() => {
            const serie1 = lineChart.trace1.getCSSProperty("opacity");
            const value = Number(serie1.value);

            return value === 0.5;
        }, 1000, "expected trace to hide with value 0.5");
    });
});

describe("Pie Chart", () => {
    beforeAll(() => {
        pieChart.open();
    });

    it("should generate a chart", () => {
        pieChart.pieChart.waitForExist();
        const exists = pieChart.pieChart.isExisting();

        expect(exists).toBeTruthy();
    });

    it("should have multiple slices", () => {
        browser.waitUntil(() => {
            return pieChart.slices.filter((elem) => elem.isDisplayed()).length > 1;
        });

        expect(pieChart.slices.filter((elem) => elem.isDisplayed()).length).toBeGreaterThan(1);

    });

});

describe("Bubble chart", () => {
    beforeAll(() => {
        bubbleChart.open();
    });

    it("should generate a chart", () => {
        bubbleChart.bubble.waitForExist();
        const isExist = bubbleChart.bubble.isExisting();

        expect(isExist).toBeTruthy();
    });

    it("should have at least 2 bubbles for each trace", () => {
        browser.waitUntil(() => {
            return bubbleChart.bubbles.filter((elem) => elem.isDisplayed()).length > 1;
        });

        expect(bubbleChart.bubbles.filter((elem) => elem.isDisplayed()).length).toBeGreaterThan(1);

    });
});

// TO DO: Check why we're skipping this spec

xdescribe("Polar chart", () => {
    beforeAll(() => {
        polarChart.open();
    });

    xit("should generate a chart", () => {
        polarChart.polar.waitForDisplayed();
        const nodeName = polarChart.polar.getAttribute("nodeName");

        expect(nodeName).toBe("svg");
    });

    xit("should be generated with two traces", () => {
        browser.waitUntil(() => {
            return polarChart.traces.map((elem) => elem.isDisplayed()).length > 1;
        });
        expect(polarChart.traces.map((elem) => elem.isDisplayed()).length).toBe(2);
    });

    // TO DO: with other drivers apart from chrome it does not autoscroll to the element in overflow:auto block
    xit("should hide a line serie when a serie toggle item is clicked", () => {
        polarChart.trace1.waitForDisplayed();
        polarChart.trace1.click();
        const serie1 = polarChart.trace1.getCSSProperty("opacity");
        polarChart.trace1.waitForDisplayed();
        const value = Number(serie1.value);

        expect(value).toBe(0.5);
    });
});
