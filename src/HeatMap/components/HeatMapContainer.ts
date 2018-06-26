let __webpack_public_path__: string;
import { Component, createElement } from "react";
import { Provider } from "react-redux";

import HeatMapDataHandler from "./HeatMapDataHandler";
import { Container } from "../../utils/namespaces";
import { store } from "../../store";
import { generateInstanceID } from "../../utils/data";

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

class HeatMapContainer extends Component<Container.HeatMapContainerProps> {
    private instanceID = this.getInstanceID(this.props.friendlyId);

    render() {
        return createElement(Provider, { store },
            createElement(HeatMapDataHandler, {
                ...this.props as Container.HeatMapContainerProps,
                instanceID: this.instanceID
            })
        );
    }

    private getInstanceID(friendlyId: string): string {
        let widgetID = generateInstanceID(friendlyId);
        const state = store.getState();
        const instances: string[] = Object.keys(state.heatmap);
        while (instances.indexOf(widgetID) > -1) {
            widgetID = generateInstanceID(friendlyId);
        }

        return widgetID;
    }
}

export { HeatMapContainer as default, __webpack_public_path__ };
