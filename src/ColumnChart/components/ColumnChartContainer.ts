import { SFC, createElement } from "react";
import BarChartContainer from "../../BarChart/components/BarChartContainer";
import { Container } from "../../utils/namespaces";
import BarChartContainerProps = Container.BarChartContainerProps;

const ColumnChartContainer: SFC<BarChartContainerProps> = (props) =>
    createElement(BarChartContainer, { ...props as BarChartContainerProps, orientation: "column" });

export { ColumnChartContainer as default };
