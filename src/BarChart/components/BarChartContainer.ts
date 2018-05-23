let __webpack_public_path__;
import { SFC, createElement } from "react";
import { Provider } from "react-redux";

import BarChartDataHandler from "./BarChartDataHandler";
import { Container } from "../../utils/namespaces";
import { store } from "../store/store";
import BarChartContainerProps = Container.BarChartContainerProps;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

const BarChartContainer: SFC<BarChartContainerProps> = props =>
    createElement(Provider, { store }, createElement(BarChartDataHandler, props));

BarChartContainer.defaultProps = { orientation: "bar" };

export { BarChartContainer as default, __webpack_public_path__ };
