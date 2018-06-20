let __webpack_public_path__: string;
import { SFC, createElement } from "react";
import { Provider } from "react-redux";

import HeatMapDataHandler from "./HeatMapDataHandler";
import { Container } from "../../utils/namespaces";
import { store } from "../../store";

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

export const HeatMapContainer: SFC<Container.HeatMapContainerProps> = props =>
    createElement(Provider, { store }, createElement(HeatMapDataHandler, props));

export { HeatMapContainer as default, __webpack_public_path__ };
