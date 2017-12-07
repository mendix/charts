import { Component, createElement } from "react";

import { AnyChart } from "../AnyChart/components/AnyChart";
// import { AnyChartContainerPropsBase } from "./components/interfaces";
import { Container } from "../utils/namespaces";
import AnyChartContainerProps = Container.AnyChartContainerProps;
// import AnyChartContainerState = Container.AnyChartContainerState;

// tslint:disable-next-line class-name
export class preview extends Component<AnyChartContainerProps, {}> {
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
