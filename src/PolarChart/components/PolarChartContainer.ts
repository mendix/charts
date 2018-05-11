let __webpack_public_path__: string;
import { SFC, createElement } from "react";
import LineChartContainer from "../../LineChart/components/LineChartContainer";
import { Container } from "../../utils/namespaces";

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

const PolarChartContainer: SFC<Container.PolarChartContainerProps> = props =>
    createElement(LineChartContainer, {
        ...props as Container.LineChartContainerProps,
        fill: true,
        type: "polar",
        polar: {
            radialaxis: {
                rangemode: props.rangeMode,
                showgrid: props.showGrid,
                gridcolor: "#d7d7d7",
                tickcolor: "#d7d7d7"
            },
            angularaxis: {
                linecolor: "#d7d7d7",
                tickcolor: "#d7d7d7"
            }
        }
    });

export { PolarChartContainer as default, __webpack_public_path__ };
