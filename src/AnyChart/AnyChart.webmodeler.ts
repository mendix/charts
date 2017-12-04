import { Component, createElement } from "react";

import { AnyChart } from "../AnyChart/components/AnyChart";
import { AnyChartContainerPropsBase } from "./components/interfaces";

// tslint:disable-next-line class-name
export class preview extends Component<AnyChartContainerPropsBase, {}> {
    render() {
        return createElement("div", {},
            createElement(AnyChart, this.props as any)
        );
    }
}

export function getPreviewCss() {
    return (
        require("../ui/Charts.scss") +
        require("../ui/ChartsLoading.scss")
    );
}
