import { Component, ReactChild, createElement } from "react";

import { BarChart } from "./BarChart";
import { ChartContainer } from "../../components/ChartContainer";
import { SeriesData, SeriesProps, validateSeriesProps } from "../../utils/data";
import { Dimensions } from "../../utils/style";
import { BarLayoutProps, WrapperProps } from "../../utils/types";

export interface BarChartContainerProps extends WrapperProps, Dimensions, BarLayoutProps {
    series: SeriesProps[];
}

interface BarChartContainerState {
    alertMessage?: ReactChild;
    data?: SeriesData[];
    loading?: boolean;
}

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
            series: this.props.series
        }, createElement(BarChart, this.props));
    }
}
