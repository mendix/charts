import { Component, ReactChild, ReactElement, cloneElement, createElement, isValidElement } from "react";

import { Alert } from "./Alert";
import { fetchSeriesData, handleOnClick } from "../utils/data";
import { Data } from "../utils/namespaces";
import SeriesProps = Data.SeriesProps;
import SeriesData = Data.SeriesData;

export interface ChartContainerProps {
    mxObject?: mendix.lib.MxObject;
    series: SeriesProps[];
    alertMessage?: ReactChild;
}

interface ChartContainerState {
    alertMessage?: ReactChild;
    data?: SeriesData[];
    loading?: boolean;
}

export class ChartContainer extends Component<ChartContainerProps, ChartContainerState> {
    private subscriptionHandle: number;

    constructor(props: ChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: props.alertMessage,
            data: [],
            loading: true
        };
        this.fetchData = this.fetchData.bind(this);
    }

    render() {
        return createElement("div", {}, this.renderContent());
    }

    componentWillReceiveProps(newProps: ChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        if (!newProps.alertMessage) {
            if (!this.state.loading) {
                this.setState({ loading: true });
            }
            this.fetchData(newProps.mxObject);
        } else {
            this.setState({ alertMessage: newProps.alertMessage });
        }
    }

    componentWillUnmount() {
        if (this.subscriptionHandle) {
            mx.data.unsubscribe(this.subscriptionHandle);
        }
    }

    private renderContent(): ReactElement<any> {
        if (this.props.children && isValidElement(this.props.children)) {
            return cloneElement(this.props.children as ReactElement<any>, {
                data: this.state.data,
                loading: this.state.loading,
                alertMessage: this.state.alertMessage,
                onClick: handleOnClick,
                onHover: ChartContainer.openTooltipForm
            });
        }

        return createElement(Alert, { className: "widget-charts-alert" },
            "Invalid child: should be a valid react element"
        );
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
        if (mxObject && this.props.series.length) {
            Promise.all(this.props.series.map(series => fetchSeriesData(mxObject, series)))
                .then(data => this.setState({ loading: false, data }))
                .catch(reason => {
                    window.mx.ui.error(reason);
                    this.setState({ loading: false, data: [] });
                });
        } else {
            this.setState({ loading: false, data: [] });
        }
    }

    private static openTooltipForm(domNode: HTMLDivElement, tooltipForm: string, dataObject: mendix.lib.MxObject) {
        const context = new mendix.lib.MxContext();
        context.setContext(dataObject.getEntity(), dataObject.getGuid());
        window.mx.ui.openForm(tooltipForm, { domNode, context });
    }
}
