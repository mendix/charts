import { Component, ReactElement, createElement } from "react";

import { PieChart } from "./PieChart";
import { OnClickProps, fetchByMicroflow, fetchByXPath, handleOnClick, validateAdvancedOptions } from "../../utils/data";
import { Dimensions } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

export type ChartType = "pie" | "donut";

export interface PieChartContainerProps extends WrapperProps, Dimensions, OnClickProps {
    dataEntity: string;
    dataSourceType: "XPath" | "microflow";
    entityConstraint: string;
    dataSourceMicroflow: string;
    colorAttribute: string;
    nameAttribute: string;
    valueAttribute: string;
    sortAttribute: string;
    chartType: ChartType;
    showToolbar: boolean;
    showLegend: boolean;
    tooltipForm: string;
    layoutOptions: string;
    dataOptions: string;
    sampleData: string;
}

interface PieChartContainerState {
    alertMessage?: string | ReactElement<any>;
    data: mendix.lib.MxObject[];
    loading?: boolean;
}

export default class PieChartContainer extends Component<PieChartContainerProps, PieChartContainerState> {
    private subscriptionHandle: number;

    constructor(props: PieChartContainerProps) {
        super(props);

        this.state = {
            data: [],
            alertMessage: PieChartContainer.validateProps(this.props),
            loading: true
        };
        this.fetchData = this.fetchData.bind(this);
        this.handleOnClick = this.handleOnClick.bind(this);
        this.openTooltipForm = this.openTooltipForm.bind(this);
    }

    render() {
        return createElement("div", {}, this.getContent());
    }

    componentWillReceiveProps(newProps: PieChartContainerProps) {
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

    private getContent() {
        return createElement(PieChart, {
            ...this.props,
            alertMessage: this.state.alertMessage,
            loading: this.state.loading,
            data: this.state.data,
            onClick: this.handleOnClick,
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
        const { dataEntity, dataSourceMicroflow, dataSourceType, entityConstraint, sortAttribute } = this.props;
        if (mxObject && dataEntity) {
            if (dataSourceType === "XPath") {
                fetchByXPath(mxObject.getGuid(), dataEntity, entityConstraint, sortAttribute)
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

    private handleOnClick(index: number) {
        if (this.state.data && this.state.data.length) {
            const dataObject = this.state.data[ index ];
            handleOnClick(this.props, dataObject);
        }
    }

    private openTooltipForm(domNode: HTMLDivElement, index: number) {
        if (this.state.data && this.state.data.length) {
            const dataObject = this.state.data[index];
            const context = new mendix.lib.MxContext();
            context.setContext(dataObject.getEntity(), dataObject.getGuid());
            window.mx.ui.openForm(this.props.tooltipForm, { domNode, context });
        }
    }

    public static validateProps(props: PieChartContainerProps): string | ReactElement<any> {
        const errorMessage: string[] = [];
        if (props.dataSourceType === "microflow" && !props.dataSourceMicroflow) {
                errorMessage.push("'Data source type' is set to 'Microflow' but the microflow is missing");
        }
        if (props.dataOptions && props.dataOptions.trim()) {
            const error = validateAdvancedOptions(props.dataOptions.trim());
            if (error) {
                errorMessage.push(`Invalid options JSON: ${error}`);
            }
        }
        if (props.sampleData && props.sampleData.trim()) {
            const error = validateAdvancedOptions(props.sampleData.trim());
            if (error) {
                errorMessage.push(`Invalid sample data JSON: ${error}`);
            }
        }
        if (props.layoutOptions && props.layoutOptions.trim()) {
            const error = validateAdvancedOptions(props.layoutOptions.trim());
            if (error) {
                errorMessage.push(`Invalid layout JSON: ${error}`);
            }
        }
        if (errorMessage.length) {
            return createElement("div", {},
                `Configuration error in widget ${props.friendlyId}:`,
                errorMessage.map((message, key) => createElement("p", { key }, message))
            );
        }

        return "";
    }
}
