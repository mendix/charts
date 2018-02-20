let __webpack_public_path__;
import { SFC, createElement } from "react";
import LineChartContainer from "../../LineChart/components/LineChartContainer";
import { Container } from "../../utils/namespaces";
__webpack_public_path__ = window.mx.baseUrl + "../widgets/";

const TimeSeriesContainer: SFC<Container.LineChartContainerProps> = props =>
    createElement(LineChartContainer, { ...props as Container.LineChartContainerProps, xAxisType: "date" });

export { TimeSeriesContainer as default };
