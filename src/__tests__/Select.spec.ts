import { shallow } from "enzyme";
import { createElement } from "react";
import { Select, SelectProps } from "../components/Select";

describe("Select", () => {
    const defaultProps: SelectProps = {
        onChange: jasmine.createSpy("onChange"),
        options: [ { name: "option", value: "Option 1", isDefaultSelected: false } ]
    };

    xit("should render the structure correctly", () => {
        const switcher = shallow(createElement(Select, defaultProps));

        expect(switcher).toBeElement(
            createElement("select", { className: "form-control", onChange: jasmine.any(Function) },
                createElement("option", { value: "layout" }, "Layout"),
                createElement("option", { value: "data" }, "Data")
            )
        );
    });

    xit("should respond to changes in selection", () => {
        const onChangeSpy = defaultProps.onChange = jasmine.createSpy("onChange");
        const switcher = shallow(createElement(Select, defaultProps));
        switcher.simulate("change");

        expect(onChangeSpy).toHaveBeenCalled();
    });
});
