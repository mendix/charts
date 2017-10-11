import { Component, ReactElement, createElement } from "react";

import { DataSourceProps, OnClickProps, fetchSeriesData, handleOnClick, validateSeriesProps } from "../../utils/data";
import { Data, LineChart, Mode } from "./LineChart";
import { Dimensions } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

export interface LineChartContainerProps extends WrapperProps, Dimensions {
    series: SeriesProps[];
    showGrid: boolean;
    mode: Mode;
    lineColor: string;
    fill: boolean;
    showToolbar: boolean;
    showLegend: boolean;
    tooltipForm: string;
    xAxisLabel: string;
    yAxisLabel: string;
    layoutOptions: string;
}

interface LineChartContainerState {
    alertMessage?: string | ReactElement<any>;
    data?: Data[];
    series: SeriesProps[];
    layoutOptions: object;
    loading?: boolean;
}

export interface SeriesProps extends DataSourceProps, OnClickProps {
    name: string;
    mode: Mode;
    lineColor: string;
    lineStyle: "linear" | "spline";
}

export default class LineChartContainer extends Component<LineChartContainerProps, LineChartContainerState> {
    static defaultProps = {
        fill: false
    };
    private subscriptionHandle: number;

    constructor(props: LineChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: validateSeriesProps(props.series, this.props.friendlyId, props.layoutOptions),
            data: [],
            series: props.series.slice(),
            layoutOptions: props.layoutOptions ? JSON.parse(props.layoutOptions) : {},
            loading: true
        };
        this.fetchData = this.fetchData.bind(this);
        this.openTooltipForm = this.openTooltipForm.bind(this);
        this.updateChart = this.updateChart.bind(this);
    }

    render() {
        return createElement(LineChart, {
            ... this.props,
            data: this.state.data,
            loading: this.state.loading,
            alertMessage: this.state.alertMessage,
            onClick: handleOnClick,
            onHover: this.props.tooltipForm ? this.openTooltipForm : undefined
        });
    }

    componentWillReceiveProps(newProps: LineChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        if (!this.state.alertMessage) {
            if (!this.state.loading) {
                this.setState({ loading: true });
            }
            this.fetchData(newProps.mxObject);
        }
    }

    componentWillUnmount() {
        if (this.subscriptionHandle) {
            mx.data.unsubscribe(this.subscriptionHandle);
        }
    }

    private updateChart(layoutOptions: object, series: SeriesProps[]) {
        this.setState({ layoutOptions, series });
        this.fetchData(this.props.mxObject);
    }

    private openTooltipForm(domNode: HTMLDivElement, dataObject: mendix.lib.MxObject) {
        const context = new mendix.lib.MxContext();
        context.setContext(dataObject.getEntity(), dataObject.getGuid());
        window.mx.ui.openForm(this.props.tooltipForm, { domNode, context });
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        this.componentWillUnmount();

        if (mxObject) {
            this.subscriptionHandle = mx.data.subscribe({
                callback: () => this.fetchData(mxObject),
                guid: mxObject.getGuid()
            });
        }
    }

    private fetchData(mxObject?: mendix.lib.MxObject) {
        if (mxObject && this.state.series.length) {
            Promise.all(this.state.series.map(series => fetchSeriesData(mxObject, series)))
                .then(data => {
                    this.setState({ loading: false, data });
                }).catch(reason => {
                    window.mx.ui.error(reason);
                    this.setState({ data: [], loading: false });
                });
        } else {
            this.setState({ loading: false, data: [] });
        }
    }
}
