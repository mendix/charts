import { SFC, createElement } from "react";
import LineChartContainer, { LineChartContainerProps } from "../../LineChart/components/LineChartContainer";

const TimeSeriesContainer: SFC<LineChartContainerProps> = props =>
    createElement(LineChartContainer, { ...props, xAxisType: "date" });

export { TimeSeriesContainer as default };
