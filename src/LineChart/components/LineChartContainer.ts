let __webpack_public_path__: string;
import { Component, createElement } from "react";
import { Container } from "../../utils/namespaces";

import LineChartContainerProps = Container.LineChartContainerProps;
import LineChartDataHandler from "./LineChartDataHandler";
import { Provider } from "react-redux";
import { store } from "../../store";
import { generateInstanceID } from "../../utils/data";

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

class LineChartContainer extends Component<LineChartContainerProps> {
    static defaultProps: Partial<LineChartContainerProps> = { fill: false, type: "line" };
    private instanceID = this.getInstanceID(this.props.friendlyId);

    render() {
        return createElement(Provider, { store },
            createElement(LineChartDataHandler, {
                ...this.props as LineChartContainerProps,
                instanceID: this.instanceID
            })
        );
    }

    private getInstanceID(friendlyId: string): string {
        let widgetID = generateInstanceID(friendlyId);
        const state = store.getState();
        const instances: string[] = Object.keys(state.scatter);
        while (instances.indexOf(widgetID) > -1) {
            widgetID = generateInstanceID(friendlyId);
        }

        return widgetID;
    }
}

export { LineChartContainer as default, __webpack_public_path__ };
