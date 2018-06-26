let __webpack_public_path__;
import { Component, createElement } from "react";
import { Provider } from "react-redux";

import { store } from "../../store";
import AnyChartDataHandler from "./AnyChartDataHandler";
import { Container } from "../../utils/namespaces";
import AnyChartContainerProps = Container.AnyChartContainerProps;
import { generateInstanceID } from "../../utils/data";

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

class AnyChartContainer extends Component<AnyChartContainerProps> {
    private instanceID = this.getInstanceID(this.props.friendlyId);

    render() {
        return createElement(Provider, { store },
            createElement(AnyChartDataHandler, {
                ...this.props as AnyChartContainerProps,
                instanceID: this.instanceID
            })
        );
    }

    private getInstanceID(friendlyId: string): string {
        let instanceID = generateInstanceID(friendlyId);
        const state = store.getState();
        const instances: string[] = Object.keys(state.any);
        while (instances.indexOf(instanceID) > -1) {
            instanceID = generateInstanceID(friendlyId);
        }

        return instanceID;
    }
}

export { AnyChartContainer as default, __webpack_public_path__ };
