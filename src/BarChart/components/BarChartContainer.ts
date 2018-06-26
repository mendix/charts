let __webpack_public_path__;
import { Component, createElement } from "react";
import { Provider } from "react-redux";

import BarChartDataHandler from "./BarChartDataHandler";
import { Container } from "../../utils/namespaces";
import { store } from "../../store";
import BarChartContainerProps = Container.BarChartContainerProps;
import { generateInstanceID } from "../../utils/data";

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

class BarChartContainer extends Component<BarChartContainerProps> {
    static defaultProps: Partial<BarChartContainerProps> = { orientation: "bar" };
    private instanceID = this.getInstanceID(this.props.friendlyId);

    render() {
        return createElement(Provider, { store },
            createElement(BarChartDataHandler, {
                ...this.props as BarChartContainerProps,
                instanceID: this.instanceID
            })
        );
    }

    private getInstanceID(friendlyId: string): string {
        let instanceID = generateInstanceID(friendlyId);
        const state = store.getState();
        const instances: string[] = Object.keys(state.bar);
        while (instances.indexOf(instanceID) > -1) {
            instanceID = generateInstanceID(friendlyId);
        }

        return instanceID;
    }
}

export { BarChartContainer as default, __webpack_public_path__ };
