let __webpack_public_path__: string;
import { Component, createElement } from "react";
import { Provider } from "react-redux";
import { store } from "../../store";

import { getInstanceID } from "../../utils/data";
import { Container } from "../../utils/namespaces";
import PieChartDataHandler from "./PieChartDataHandler";
import PieChartContainerProps = Container.PieChartContainerProps;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

class PieChartContainer extends Component<PieChartContainerProps> {
    private instanceID = getInstanceID(this.props.friendlyId, store, "pie");

    render() {
        return createElement(Provider, { store },
            createElement(PieChartDataHandler, {
                ...this.props as PieChartContainerProps,
                instanceID: this.instanceID
            })
        );
    }
}

export { PieChartContainer as default, __webpack_public_path__ };
