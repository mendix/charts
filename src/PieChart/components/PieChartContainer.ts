let __webpack_public_path__;
import { Component, ReactChild, createElement } from "react";

import { PieChart } from "./PieChart";
import { fetchByMicroflow, fetchByXPath, handleOnClick, validateSeriesProps } from "../../utils/data";
import { Container } from "../../utils/namespaces";
import { getDimensions, parseStyle } from "../../utils/style";
import PieChartContainerProps = Container.PieChartContainerProps;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

interface PieChartContainerState {
    alertMessage?: ReactChild;
    data: mendix.lib.MxObject[];
    loading?: boolean;
}

export default class PieChartContainer extends Component<PieChartContainerProps, PieChartContainerState> {
    private subscriptionHandle?: number;
    private intervalID?: number;

    constructor(props: PieChartContainerProps) {
        super(props);

        this.state = {
            data: [],
            alertMessage: validateSeriesProps([ { ...props, seriesOptions: props.dataOptions } ], props.friendlyId, props.layoutOptions),
            loading: true
        };
        this.fetchData = this.fetchData.bind(this);
        this.openTooltipForm = this.openTooltipForm.bind(this);
    }

    render() {
        return createElement("div", {
            style: this.state.loading ? { ...getDimensions(this.props), ...parseStyle(this.props.style) } : undefined
        }, this.getContent());
    }

    componentWillReceiveProps(newProps: PieChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        if (!this.state.alertMessage) {
            this.fetchData(newProps.mxObject);
            this.setRefreshInterval(newProps.refreshInterval, newProps.mxObject);
        }
    }

    componentWillUnmount() {
        if (this.subscriptionHandle) {
            window.mx.data.unsubscribe(this.subscriptionHandle);
        }
        this.clearRefreshInterval();
    }

    private setRefreshInterval(refreshInterval: number, mxObject?: mendix.lib.MxObject) {
        if (refreshInterval > 0 && mxObject) {
            this.clearRefreshInterval();
            this.intervalID = window.setInterval(() => {
                if (!this.state.loading) {
                    this.fetchData(mxObject);
                }
            }, refreshInterval);
        }
    }

    private clearRefreshInterval() {
        if (this.intervalID) {
            window.clearInterval(this.intervalID);
        }
    }

    private getContent() {
        return createElement(PieChart, {
            ...this.props as PieChartContainerProps,
            alertMessage: this.state.alertMessage,
            loading: this.state.loading,
            data: this.state.data,
            onClick: handleOnClick,
            onHover: this.props.tooltipForm ? this.openTooltipForm : undefined
        });
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        if (this.subscriptionHandle) {
            window.mx.data.unsubscribe(this.subscriptionHandle);
        }

        if (mxObject) {
            this.subscriptionHandle = window.mx.data.subscribe({
                callback: () => this.fetchData(mxObject),
                guid: mxObject.getGuid()
            });
        }
    }

    private fetchData(mxObject?: mendix.lib.MxObject) {
        if (!this.state.loading) {
            this.setState({ loading: true });
        }
        const { dataEntity, dataSourceMicroflow, dataSourceType, entityConstraint, sortAttribute, sortOrder } = this.props;
        if (mxObject && dataEntity) {
            if (dataSourceType === "XPath") {
                fetchByXPath(mxObject.getGuid(), dataEntity, entityConstraint, sortAttribute, sortOrder)
                    .then(data => this.setState({ data, loading: false }))
                    .catch(reason => {
                        window.mx.ui.error(`An error occurred while retrieving chart data: ${reason}`);
                        this.setState({ data: [], loading: false });
                    });
            } else if (dataSourceType === "microflow" && dataSourceMicroflow) {
                fetchByMicroflow(dataSourceMicroflow, mxObject.getGuid())
                    .then(data => this.setState({ data, loading: false }))
                    .catch(reason => {
                        window.mx.ui.error(`An error occurred while retrieving chart data: ${reason}`);
                        this.setState({ data: [], loading: false });
                    });
            }
        } else {
            this.setState({ loading: false, data: [] });
        }
    }

    private openTooltipForm(domNode: HTMLDivElement, dataObject: mendix.lib.MxObject) {
        const context = new mendix.lib.MxContext();
        context.setContext(dataObject.getEntity(), dataObject.getGuid());
        window.mx.ui.openForm(this.props.tooltipForm, { domNode, context });
    }
}
