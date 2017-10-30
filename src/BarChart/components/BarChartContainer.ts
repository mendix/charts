import { Component, ReactElement, createElement } from "react";

import { BarChart } from "./BarChart";
import { SeriesData, SeriesProps, fetchSeriesData, handleOnClick, validateSeriesProps } from "../../utils/data";
import { Dimensions } from "../../utils/style";
import { BarLayoutProps, WrapperProps } from "../../utils/types";

export interface BarChartContainerProps extends WrapperProps, Dimensions, BarLayoutProps {
    series: SeriesProps[];
}

interface BarChartContainerState {
    alertMessage?: string | ReactElement<any>;
    data?: SeriesData[];
    loading?: boolean;
}

export default class BarChartContainer extends Component<BarChartContainerProps, BarChartContainerState> {
    static defaultProps: Partial<BarChartContainerProps> = {
        orientation: "bar"
    };
    private subscriptionHandle: number;

    constructor(props: BarChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: validateSeriesProps(this.props.series, this.props.friendlyId, props.layoutOptions),
            loading: true,
            data: []
        };
        this.fetchData = this.fetchData.bind(this);
        this.openTooltipForm = this.openTooltipForm.bind(this);
    }

    render() {
        return createElement(BarChart, {
            ...this.props,
            alertMessage: this.state.alertMessage,
            loading: this.state.loading,
            data: this.state.data,
            onClick: handleOnClick,
            onHover: this.openTooltipForm
        });
    }

    componentWillReceiveProps(newProps: BarChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        if (!this.state.alertMessage) {
            this.fetchData(newProps.mxObject);
        }
    }

    componentWillUnmount() {
        if (this.subscriptionHandle) {
            window.mx.data.unsubscribe(this.subscriptionHandle);
        }
    }

    private openTooltipForm(domNode: HTMLDivElement, tooltipForm: string, dataObject: mendix.lib.MxObject) {
        const context = new mendix.lib.MxContext();
        context.setContext(dataObject.getEntity(), dataObject.getGuid());
        window.mx.ui.openForm(tooltipForm, { domNode, context });
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        this.componentWillUnmount();

        if (mxObject) {
            this.subscriptionHandle = window.mx.data.subscribe({
                callback: () => this.fetchData(mxObject),
                guid: mxObject.getGuid()
            });
        }
    }

    private fetchData(mxObject?: mendix.lib.MxObject) {
        if (mxObject && this.props.series.length) {
            Promise.all(this.props.series.map(series => fetchSeriesData(mxObject, series)))
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
