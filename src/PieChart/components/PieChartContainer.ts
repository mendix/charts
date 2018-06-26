let __webpack_public_path__: string;
import { Component, createElement } from "react";
import { Provider } from "react-redux";

import { Container } from "../../utils/namespaces";
import PieChartDataHandler from "./PieChartDataHandler";
import { store } from "../../store";
import PieChartContainerProps = Container.PieChartContainerProps;
import { generateInstanceID } from "../../utils/data";

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

class PieChartContainer extends Component<PieChartContainerProps> {
    private instanceID = this.getInstanceID(this.props.friendlyId);

    render() {
        return createElement(Provider, { store },
            createElement(PieChartDataHandler, {
                ...this.props as PieChartContainerProps,
                instanceID: this.instanceID
            })
        );
    }

    private getInstanceID(friendlyId: string): string {
        let widgetID = generateInstanceID(friendlyId);
        const state = store.getState();
        const instances: string[] = Object.keys(state.pie);
        while (instances.indexOf(widgetID) > -1) {
            widgetID = generateInstanceID(friendlyId);
        }

        return widgetID;
    }
}

export { PieChartContainer as default, __webpack_public_path__ };
