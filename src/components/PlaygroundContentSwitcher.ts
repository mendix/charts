import { Component, ReactElement, SyntheticEvent, createElement } from "react";
import { SeriesPlaygroundOptions } from "./Playground";

interface PlaygroundContentSwitcherProps {
    onChange: (event: SyntheticEvent<HTMLSelectElement>) => void;
    series?: SeriesPlaygroundOptions;
}

export class PlaygroundContentSwitcher extends Component<PlaygroundContentSwitcherProps> {
    render() {
        if (!this.props.series) {
            return createElement("select", { className: "form-control", onChange: this.props.onChange },
                createElement("option", { value: "layout" }, "Layout"),
                createElement("option", { value: "data" }, "Data")
            );
        }

        return createElement("select", { className: "form-control", onChange: this.props.onChange },
            createElement("option", { value: "layout" }, "Layout"),
            this.renderSeriesSelectOptions()
        );
    }

    private renderSeriesSelectOptions(): ReactElement<any>[] | null {
        if (this.props.series && this.props.series.rawData) {
            return this.props.series.rawData.map(({ series }, index) =>
                createElement("option", { value: index, key: `series-option-${index}` }, series.name)
            );
        }

        return null;
    }
}
