let __webpack_public_path__: string;
import { SFC, createElement } from "react";
import LineChartContainer from "../../LineChart/components/LineChartContainer";
import { Container } from "../../utils/namespaces";
__webpack_public_path__ = window.mx.remoteUrl + "widgets/";

const TimeSeriesContainer: SFC<Container.LineChartContainerProps> = props =>
    createElement(LineChartContainer, {
        ...props as Container.LineChartContainerProps,
        type: "timeseries",
        xAxisType: "date"
    });

export { TimeSeriesContainer as default, __webpack_public_path__ };
