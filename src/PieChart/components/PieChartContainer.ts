let __webpack_public_path__: string;
import { SFC, createElement } from "react";
import { Provider } from "react-redux";

import { Container } from "../../utils/namespaces";
import PieChartDataHandler from "./PieChartDataHandler";
import { store } from "../../store";
import PieChartContainerProps = Container.PieChartContainerProps;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

export const PieChartContainer: SFC<PieChartContainerProps> = props =>
    createElement(Provider, { store }, createElement(PieChartDataHandler, props));

export { PieChartContainer as default, __webpack_public_path__ };
