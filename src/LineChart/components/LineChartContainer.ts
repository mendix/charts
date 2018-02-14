import { Component, createElement } from "react";

import { ChartContainer } from "../../components/ChartContainer";
import { validateSeriesProps } from "../../utils/data";
import { LineChart } from "./LineChart";
import { Container } from "../../utils/namespaces";
import { getDimensions, parseStyle } from "../../utils/style";
import LineChartContainerProps = Container.LineChartContainerProps;
import LineChartContainerState = Container.LineChartContainerState;

export default class LineChartContainer extends Component<LineChartContainerProps, LineChartContainerState> {
    static defaultProps: Partial<LineChartContainerProps> = { fill: false };

    constructor(props: LineChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: validateSeriesProps(props.series, props.friendlyId, props.layoutOptions)
        };
    }

    render() {
        return createElement(ChartContainer, {
            alertMessage: this.state.alertMessage,
            mxObject: this.props.mxObject,
            series: this.props.series,
            style: { ...getDimensions(this.props), ...parseStyle(this.props.style) }
        }, createElement(LineChart, this.props));
    }
}
