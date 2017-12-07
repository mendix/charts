import { shallow } from "enzyme";
import { createElement } from "react";
import { ChartLoading } from "../components/ChartLoading";

describe("ChartLoading", () => {
    it("should render the structure correctly", () => {
        const loading = shallow(createElement(ChartLoading, { text: "Loading" }));

        expect(loading).toBeElement(
            createElement("div", { className: "widget-charts-loading-wrapper" },
                createElement("div", { className: "widget-charts-loading" },
                    createElement("div", { className: "widget-charts-loading-bar bar-one" }),
                    createElement("div", { className: "widget-charts-loading-bar bar-two" }),
                    createElement("div", { className: "widget-charts-loading-bar bar-three" }),
                    createElement("div", { className: "widget-charts-loading-bar bar-four" }),
                    createElement("div", { className: "widget-charts-loading-bar bar-five" }),
                    createElement("div", { className: "widget-charts-loading-bar bar-six" }),
                    createElement("div", { className: "widget-charts-loading-bar bar-seven" })
                ),
                createElement("div", { className: "widget-charts-loading-text" }, "Loading")
            )
        );
    });
});
