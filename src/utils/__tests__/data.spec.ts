import { validateSeriesProps } from "../data";
import { shallow } from "enzyme";
import { random } from "faker";
// import { Data } from "../namespaces";
import { createElement } from "react";

describe("utils/data", () => {
    // const sampleSeries: Partial<Data.SeriesProps>[] = [
    //     {
    //         name: random.word(),
    //         seriesOptions: "{ 'title': 'Awesomeness' }",
    //         xValueAttribute: random.word(),
    //         xValueSortAttribute: random.word(),
    //         sortOrder: "asc",
    //         yValueAttribute: random.word(),
    //         dataSourceMicroflow: random.word(),
    //         dataSourceType: "XPath", // "XPath" | "microflow" | "REST"
    //         restUrl: internet.url(),
    //         restParameters: [],
    //         entityConstraint: random.word(),
    //         dataEntity: random.word(),
    //         barColor: internet.color()
    //     }
    // ];
    // const validLayoutJSON = "{ 'title': 'Awesome' }";
    const validConfigurationOptions = "{ \"displayModeBar\": false }";
    const invalidJSON = "}";

    describe("#validateSeriesProps", () => {
        it ("returns no alert when no series, layout options or configuration options are provided", () => {
            const validationMessage = validateSeriesProps([], random.uuid(), "", "");

            expect(validationMessage).toBe("");
        });

        it ("returns an alert when the configuration options are invalid", () => {
            const widgetId = random.uuid();
            const validationMessage = shallow(validateSeriesProps([], widgetId, "", invalidJSON) as any);

            expect(validationMessage).toBeElement(
                createElement("div", {},
                    `Configuration error in widget ${widgetId}:`,
                    createElement("p", { key: 0 }, "Invalid configuration JSON: Unexpected token } in JSON at position 0")
                )
            );
        });

        it ("returns no alert when the configuration options are valid", () => {
            const widgetId = random.uuid();
            const validationMessage = validateSeriesProps([], widgetId, "", validConfigurationOptions);

            expect(validationMessage).toBe("");
        });
    });
});
