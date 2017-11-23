import { SFC, createElement } from "react";
import LineChartContainer, { LineChartContainerProps } from "../../LineChart/components/LineChartContainer";

const AreaChartContainer: SFC<LineChartContainerProps> = props =>
    createElement(LineChartContainer, { ...props as LineChartContainerProps, fill: true });

export { AreaChartContainer as default };
