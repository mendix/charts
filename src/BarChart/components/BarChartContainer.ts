let __webpack_public_path__;
import { Component, createElement } from "react";
import { Provider } from "react-redux";
import { store } from "../../store";

import { getInstanceID } from "../../utils/data";
import BarChartDataHandler from "./BarChartDataHandler";
import { Container } from "../../utils/namespaces";
import BarChartContainerProps = Container.BarChartContainerProps;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../` : "../";

class BarChartContainer extends Component<BarChartContainerProps> {
    static defaultProps: Partial<BarChartContainerProps> = { orientation: "bar" };
    private instanceID = this.props.uniqueid || getInstanceID(this.props.friendlyId, store, "bar");

    render() {
        return createElement(Provider, { store },
            createElement(BarChartDataHandler, {
                ...this.props as BarChartContainerProps,
                instanceID: this.instanceID
            })
        );
    }
}

export { BarChartContainer as default, __webpack_public_path__ };
