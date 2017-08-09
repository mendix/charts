import { Component, createElement } from "react";

class PieChartContainer extends Component<{}, {}> {
    render() {
        return createElement("div", {}, "Pie Chart");
    }
}

export { PieChartContainer as default };
