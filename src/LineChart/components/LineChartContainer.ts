import { Component, ReactChild, createElement } from "react";

import { ChartContainer } from "../../components/ChartContainer";
import { LineSeriesProps, validateSeriesProps } from "../../utils/data";
import { LineChart } from "./LineChart";
import { Dimensions } from "../../utils/style";
import { LineLayoutProps, WrapperProps } from "../../utils/types";

export interface LineChartContainerProps extends WrapperProps, Dimensions, LineLayoutProps {
    series: LineSeriesProps[];
}

interface LineChartContainerState {
    alertMessage?: ReactChild;
}

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
            series: this.props.series
        }, createElement(LineChart, this.props));
    }
}
