import { SFC, createElement } from "react";
import LineChartContainer from "../../LineChart/components/LineChartContainer";
import { Container } from "../../utils/namespaces";

const TimeSeriesContainer: SFC<Container.LineChartContainerProps> = props =>
    createElement(LineChartContainer, { ...props as Container.LineChartContainerProps, xAxisType: "date" });

export { TimeSeriesContainer as default };
