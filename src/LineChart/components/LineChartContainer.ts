let __webpack_public_path__: string;
import { SFC, createElement } from "react";
import { Container } from "../../utils/namespaces";

import LineChartContainerProps = Container.LineChartContainerProps;
import LineChartDataHandler from "./LineChartDataHandler";
import { Provider } from "react-redux";
import { store } from "../../store";

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

const LineChartContainer: SFC<LineChartContainerProps> = props =>
    createElement(Provider, { store }, createElement(LineChartDataHandler, props));

LineChartContainer.defaultProps = { fill: false, type: "line" };

export { LineChartContainer as default, __webpack_public_path__ };
