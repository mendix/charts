let __webpack_public_path__;
import { SFC, createElement } from "react";
import LineChartContainer from "../../LineChart/components/LineChartContainer";
import { Container } from "../../utils/namespaces";
import LineChartContainerProps = Container.LineChartContainerProps;
__webpack_public_path__ = window.mx.baseUrl + "../widgets/";

const AreaChartContainer: SFC<LineChartContainerProps> = props =>
    createElement(LineChartContainer, { ...props as LineChartContainerProps, fill: true });

export { AreaChartContainer as default };
