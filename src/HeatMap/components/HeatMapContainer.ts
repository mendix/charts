let __webpack_public_path__: string;
import { Component, createElement } from "react";
import { Provider } from "react-redux";
import { store } from "../../store";

import { getInstanceID } from "../../utils/data";
import { Container } from "../../utils/namespaces";
import HeatMapDataHandler from "./HeatMapDataHandler";

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

class HeatMapContainer extends Component<Container.HeatMapContainerProps> {
    private instanceID = this.props.uniqueid || getInstanceID(this.props.friendlyId, store, "heatmap");

    render() {
        return createElement(Provider, { store },
            createElement(HeatMapDataHandler, {
                ...this.props as Container.HeatMapContainerProps,
                instanceID: this.instanceID
            })
        );
    }
}

export { HeatMapContainer as default, __webpack_public_path__ };
