import { Component, ReactChild, createElement } from "react";

import { fetchByMicroflow, fetchByXPath, handleOnClick, validateSeriesProps } from "../../utils/data";
import { Container } from "../../utils/namespaces";
import { HeatMap } from "./HeatMap";
import HeatMapContainerProps = Container.HeatMapContainerProps;

interface HeatMapContainerState {
    alertMessage?: ReactChild;
    horizontalValues: string[];
    verticalValues: string[];
    data: number[][];
    loading: {
        vertical: boolean;
        horizontal: boolean;
        data: boolean;
    };
}

export default class HeatMapContainer extends Component<HeatMapContainerProps, HeatMapContainerState> {
    private subscriptionHandle: number;

    constructor(props: HeatMapContainerProps) {
        super(props);

        this.state = {
            data: [],
            alertMessage: validateSeriesProps([ { ...props, seriesOptions: props.dataOptions } ], props.friendlyId, props.layoutOptions),
            horizontalValues: [],
            verticalValues: [],
            loading: {
                vertical: true,
                horizontal: true,
                data: true
            }
        };
        this.fetchData = this.fetchData.bind(this);
        this.openTooltipForm = this.openTooltipForm.bind(this);
    }

    render() {
        return createElement("div", {}, this.getContent());
    }

    componentWillReceiveProps(newProps: HeatMapContainerProps) {
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
        return createElement(HeatMap, {
            ...this.props as HeatMapContainerProps,
            alertMessage: this.state.alertMessage,
            loading: this.state.loading.data && this.state.loading.vertical && this.state.loading.horizontal,
            data: this.state.data,
            verticalValues: this.state.verticalValues,
            horizontalValues: this.state.horizontalValues,
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
        if (!this.state.loading.vertical || !this.state.loading.horizontal || !this.state.loading.data) {
            this.setState({ loading: { vertical: true, horizontal: true, data: true } });
        }
        const { dataEntity, dataSourceMicroflow, dataSourceType } = this.props;
        if (mxObject && dataEntity) {
            if (dataSourceType === "XPath") {
                this.fetchSortedData(mxObject);
            } else if (dataSourceType === "microflow" && dataSourceMicroflow) {
                fetchByMicroflow(dataSourceMicroflow, mxObject.getGuid())
                    .then(data => {
                        const horizontalValues = this.getValues(data, this.props.horizontalNameAttribute);
                        const verticalValues = this.getValues(data, this.props.verticalNameAttribute);
                        this.setState({
                            data: this.processZData(data, verticalValues, horizontalValues),
                            loading: { vertical: false, horizontal: false, data: false },
                            horizontalValues,
                            verticalValues
                        });
                    })
                    .catch(reason => {
                        window.mx.ui.error(`An error occurred while retrieving chart data: ${reason}`);
                        this.setState({ data: [], loading: { vertical: false, horizontal: false, data: false } });
                    });
            }
        } else {
            this.setState({ loading: { vertical: false, horizontal: false, data: false }, data: [] });
        }
    }

    private fetchSortedData(mxObject: mendix.lib.MxObject) {
        const { dataEntity, entityConstraint, horizontalSortAttribute, horizontalSortOrder } = this.props;
        fetchByXPath(mxObject.getGuid(), dataEntity, entityConstraint, horizontalSortAttribute, horizontalSortOrder)
            .then(horizontalData => {
                const horizontalValues = this.getValues(horizontalData, this.props.horizontalNameAttribute);
                const { verticalSortAttribute, verticalSortOrder } = this.props;
                fetchByXPath(mxObject.getGuid(), dataEntity, entityConstraint, verticalSortAttribute, verticalSortOrder)
                    .then(verticalData => {
                        const verticalValues = this.getValues(verticalData, this.props.verticalNameAttribute);
                        const data = this.processZData(verticalData, verticalValues, horizontalValues);
                        this.setState({
                            loading: { data: false, horizontal: false, vertical: false },
                            data,
                            horizontalValues,
                            verticalValues
                        });
                    });

            })
            .catch(reason => {
                window.mx.ui.error(`An error occurred while retrieving sorted chart data: ${reason}`);
                this.setState({ data: [], loading: { vertical: false, horizontal: false, data: false } });
            });
    }

    private processZData(data: mendix.lib.MxObject[], verticalValues: string[], horizontalValues: string[]): number[][] {
        return verticalValues.map(vertical =>
            horizontalValues.map(horizontal => {
                const zData = data.find(value =>
                    value.get(this.props.verticalNameAttribute) === vertical && value.get(this.props.horizontalNameAttribute) === horizontal
                );

                return zData ? Number(zData.get(this.props.valueAttribute)) : 0;
            }));
    }

    private getValues(data: mendix.lib.MxObject[], attribute: string): string[] {
        const values: string[] = [];
        if (data.length) {
            data.forEach(item => {
                const value = item.get(attribute) as string;
                if (values.indexOf(value) === -1) {
                    values.push(value);
                }
            });
        }

        return values;
    }

    private openTooltipForm(domNode: HTMLDivElement, dataObject: mendix.lib.MxObject) {
        const context = new mendix.lib.MxContext();
        context.setContext(dataObject.getEntity(), dataObject.getGuid());
        window.mx.ui.openForm(this.props.tooltipForm, { domNode, context });
    }
}
