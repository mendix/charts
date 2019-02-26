let __webpack_public_path__: string;
import { SFC, createElement } from "react";
import BarChartContainer from "../../BarChart/components/BarChartContainer";
import { Container } from "../../utils/namespaces";
import BarChartContainerProps = Container.BarChartContainerProps;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../` : "../";

const ColumnChartContainer: SFC<BarChartContainerProps> = (props) =>
    createElement(BarChartContainer, { ...props as BarChartContainerProps, orientation: "column" });

export { ColumnChartContainer as default, __webpack_public_path__ };
