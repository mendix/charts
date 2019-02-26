let __webpack_public_path__: string;
import { Component, createElement } from "react";
import { hot } from "react-hot-loader/root";

import { Provider } from "react-redux";
import { getInstanceID } from "../../utils/data";
import { Container } from "../../utils/namespaces";
import { store } from "../../store";

import LineChartDataHandler from "./LineChartDataHandler";
import LineChartContainerProps = Container.LineChartContainerProps;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../` : "../";

class LineChartContainer extends Component<LineChartContainerProps> {
    static defaultProps: Partial<LineChartContainerProps> = { fill: false, type: "line" };
    private instanceID = this.props.uniqueid || getInstanceID(this.props.friendlyId, store, "scatter");

    render() {
        return createElement(Provider, { store },
            createElement(LineChartDataHandler, {
                ...this.props as LineChartContainerProps,
                instanceID: this.instanceID
            })
        );
    }
}

const hotContainer = hot(LineChartContainer);
export { hotContainer as default, __webpack_public_path__ };
