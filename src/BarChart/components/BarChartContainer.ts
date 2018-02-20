let __webpack_public_path__;
import { Component, createElement } from "react";

import { BarChart } from "./BarChart";
import { ChartContainer } from "../../components/ChartContainer";
import { validateSeriesProps } from "../../utils/data";
import { Container } from "../../utils/namespaces";
import { getDimensions, parseStyle } from "../../utils/style";
import BarChartContainerProps = Container.BarChartContainerProps;
import BarChartContainerState = Container.BarChartContainerState;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

export default class BarChartContainer extends Component<BarChartContainerProps, BarChartContainerState> {
    static defaultProps: Partial<BarChartContainerProps> = { orientation: "bar" };

    constructor(props: BarChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: validateSeriesProps(this.props.series, this.props.friendlyId, props.layoutOptions)
        };
    }

    render() {
        return createElement(ChartContainer, {
            alertMessage: this.state.alertMessage,
            mxObject: this.props.mxObject,
            series: this.props.series,
            style: { ...getDimensions(this.props), ...parseStyle(this.props.style) }
        }, createElement(BarChart, this.props));
    }
}
