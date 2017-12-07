import { SFC, createElement } from "react";
import LineChartContainer from "../../LineChart/components/LineChartContainer";
import { Container } from "../../utils/namespaces";
import LineChartContainerProps = Container.LineChartContainerProps;

const AreaChartContainer: SFC<LineChartContainerProps> = props =>
    createElement(LineChartContainer, { ...props as LineChartContainerProps, fill: true });

export { AreaChartContainer as default };
