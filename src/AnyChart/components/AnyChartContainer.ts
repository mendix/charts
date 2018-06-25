let __webpack_public_path__;
import { SFC, createElement } from "react";
import { Provider } from "react-redux";

import { store } from "../../store";
import AnyChartDataHandler from "./AnyChartDataHandler";
import { Container } from "../../utils/namespaces";
import AnyChartContainerProps = Container.AnyChartContainerProps;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

const AnyChartContainer: SFC<AnyChartContainerProps> = props =>
    createElement(Provider, { store }, createElement(AnyChartDataHandler, props));

export { AnyChartContainer as default, __webpack_public_path__ };
