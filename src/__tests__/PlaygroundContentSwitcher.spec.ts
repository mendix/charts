import { shallow } from "enzyme";
import { createElement } from "react";
import { PlaygroundContentSwitcher } from "../components/PlaygroundContentSwitcher";
import { SeriesData, SeriesProps } from "../utils/data";

describe("PlaygroundContentSwitcher", () => {
    describe("without a series", () => {
        it("should render the structure correctly", () => {
            const switcher = shallow(createElement(PlaygroundContentSwitcher, {
                onChange: jasmine.createSpy("onChange")
            }));

            expect(switcher).toBeElement(
                createElement("select", { className: "form-control", onChange: jasmine.any(Function) },
                    createElement("option", { value: "layout" }, "Layout"),
                    createElement("option", { value: "data" }, "Data")
                )
            );
        });

        it("should respond to changes in selection", () => {
            const onChangeSpy = jasmine.createSpy("onChange");
            const switcher = shallow(createElement(PlaygroundContentSwitcher, { onChange: onChangeSpy }));
            switcher.simulate("change");

            expect(onChangeSpy).toHaveBeenCalled();
        });
    });

    describe("with a series", () => {
        const mockData: SeriesData[] = [
            {
                series: {
                    name: "Series 1",
                    seriesOptions: "",
                    tooltipForm: "myTooltipForm.xml"
                } as SeriesProps
            } as SeriesData
        ];

        it("should render the structure correctly", () => {
            const switcher = shallow(createElement(PlaygroundContentSwitcher, {
                onChange: jasmine.createSpy("onChange"),
                series: {
                    rawData: mockData
                }
            }));

            expect(switcher.type()).toBe("select");
            expect(switcher.find("option").length).toBe(2);
        });

        it("should respond to changes in selection", () => {
            const onChangeSpy = jasmine.createSpy("onChange");
            const switcher = shallow(createElement(PlaygroundContentSwitcher, {
                onChange: onChangeSpy,
                series: {
                    rawData: mockData
                }
            }));
            switcher.simulate("change");

            expect(onChangeSpy).toHaveBeenCalled();
        });
    });
});
