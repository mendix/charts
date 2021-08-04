let __webpack_public_path__: string;
import { Component, createElement } from "react";
import { Container, Data } from "../../utils/namespaces";
import LineChartContainer from "../../LineChart/components/LineChartContainer";

__webpack_public_path__ = window.mx ? `${window.mx.remoteUrl}widgets/` : "../widgets";

export default class BubbleChartContainer extends Component<Container.LineChartContainerProps> {
    render() {
        return createElement(LineChartContainer, {
            ...this.props as Container.LineChartContainerProps,
            ...{ series: this.setSeriesMode() },
            type: "bubble"
        });
    }

    private setSeriesMode(): Data.LineSeriesProps[] {
        return this.props.series.map(series => ({
            ...series,
            lineColor: series.color || ""
        }));
    }
}

export { __webpack_public_path__ };
