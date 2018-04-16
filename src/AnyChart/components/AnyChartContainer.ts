let __webpack_public_path__;
import { Component, ReactChild, createElement } from "react";

import { AnyChart, AnyChartProps } from "./AnyChart";
import { AnyPlayground } from "./AnyPlayground";
import { validateAdvancedOptions } from "../../utils/data";

import { Container } from "../../utils/namespaces";
import AnyChartContainerProps = Container.AnyChartContainerProps;
import AnyChartContainerState = Container.AnyChartContainerState;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

export default class AnyChartContainer extends Component<AnyChartContainerProps, AnyChartContainerState> {
    state: AnyChartContainerState = {
        alertMessage: AnyChartContainer.validateSeriesProps(this.props),
        attributeData: "[]",
        attributeLayout: "{}",
        loading: false
    };
    private subscriptionHandles: number[] = [];

    render() {
        const anyProps: AnyChartProps = {
            dataStatic: this.props.dataStatic,
            layoutStatic: this.props.layoutStatic,
            attributeData: this.state.attributeData,
            attributeLayout: this.state.attributeLayout,
            configurationOptions: this.props.configurationOptions,
            onClick: this.onClick,
            onHover: this.props.tooltipForm ? this.onHover : undefined,
            width: this.props.width,
            widthUnit: this.props.widthUnit,
            height: this.props.height,
            heightUnit: this.props.heightUnit,
            alertMessage: this.state.alertMessage
        };

        return createElement("div", {},
            createElement(this.props.devMode === "developer" ? AnyPlayground : AnyChart, anyProps)
        );
    }

    componentWillReceiveProps(newProps: AnyChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        if (!this.state.alertMessage) {
            this.setState({ loading: true });
            this.fetchData(newProps.mxObject);
        }
    }

    private fetchData(mxObject?: mendix.lib.MxObject) {
        const { dataAttribute, layoutAttribute, friendlyId, sampleData, sampleLayout } = this.props;
        const attributeData = mxObject && dataAttribute ? mxObject.get(dataAttribute) as string : sampleData || "[]";
        const attributeLayout = mxObject && layoutAttribute ? mxObject.get(layoutAttribute) as string : sampleLayout || "{}";
        const errorMessages: string[] = [];
        let error = validateAdvancedOptions(attributeData);
        if (error) {
            errorMessages.push(`Data Source attribute value contains invalid JSON: \n${error}`);
        }
        error = validateAdvancedOptions(attributeLayout);
        if (error) {
            errorMessages.push(`Layout Source attribute value contains invalid JSON: \n${error}`);
        }
        this.setState({
            alertMessage: AnyChartContainer.renderError(friendlyId, errorMessages),
            loading: false,
            attributeData,
            attributeLayout
        });
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        this.subscriptionHandles.forEach(window.mx.data.unsubscribe);
        this.subscriptionHandles = [];
        if (mxObject) {
            this.subscriptionHandles.push(window.mx.data.subscribe({
                callback: () => this.fetchData(mxObject),
                guid: mxObject.getGuid()
            }));
            if (this.props.dataAttribute) {
                this.subscriptionHandles.push(window.mx.data.subscribe({
                    callback: () => this.fetchData(mxObject),
                    guid: mxObject.getGuid(),
                    attr: this.props.dataAttribute
                }));
            }
            if (this.props.layoutAttribute) {
                this.subscriptionHandles.push(window.mx.data.subscribe({
                    callback: () => this.fetchData(mxObject),
                    guid: mxObject.getGuid(),
                    attr: this.props.layoutAttribute
                }));
            }
        }
    }

    private onClick = (data: any) => {
        const { eventEntity, eventDataAttribute, onClickMicroflow } = this.props;
        if (eventEntity && eventDataAttribute && onClickMicroflow) {
            mx.data.create({
                entity: eventEntity,
                callback: object => {
                    object.set(eventDataAttribute, JSON.stringify(data));
                    mx.ui.action(onClickMicroflow, {
                        params: { applyto: "selection", guids: [ object.getGuid() ] },
                        error: error => window.mx.ui.error(`Error executing on click microflow ${onClickMicroflow} : ${error.message}`)
                    });
                },
                error: error => window.mx.ui.error(`Error creating event entity ${eventEntity} : ${error.message}`)
            });
        }
    }

    private onHover = (data: any, tooltipNode: HTMLDivElement) => {
        const { eventEntity, eventDataAttribute, tooltipForm, tooltipMicroflow, tooltipEntity } = this.props;
        if (eventEntity && eventDataAttribute && tooltipForm && tooltipMicroflow && tooltipEntity) {
            mx.data.create({
                entity: eventEntity,
                callback: object => {
                    object.set(eventDataAttribute, JSON.stringify(data));
                    mx.ui.action(tooltipMicroflow, {
                        callback: (toolTipObjects: mendix.lib.MxObject[]) => this.openTooltipForm(tooltipNode, tooltipForm, toolTipObjects[0]),
                        params: { applyto: "selection", guids: [ object.getGuid() ] },
                        error: error => window.mx.ui.error(`Error executing on hover microflow ${tooltipMicroflow} : ${error.message}`)
                    });
                },
                error: error => window.mx.ui.error(`Error creating event entity ${eventEntity} : ${error.message}`)
            });
        }
    }

    private openTooltipForm(domNode: HTMLDivElement, tooltipForm: string, dataObject: mendix.lib.MxObject) {
        const context = new mendix.lib.MxContext();
        context.setContext(dataObject.getEntity(), dataObject.getGuid());
        window.mx.ui.openForm(tooltipForm, { domNode, context });
    }

    public static validateSeriesProps(props: AnyChartContainerProps): ReactChild {
        const errorMessages: string[] = [];

        if (props.layoutStatic && props.layoutStatic.trim()) {
            const error = validateAdvancedOptions(props.layoutStatic.trim());
            if (error) {
                errorMessages.push(`Invalid static layout JSON: ${error}`);
            }
        }
        if (props.dataStatic && props.dataStatic.trim()) {
            const error = validateAdvancedOptions(props.dataStatic.trim());
            if (error) {
                errorMessages.push(`Invalid static data JSON: ${error}`);
            }
        }
        const hasEvent = props.eventEntity && props.eventDataAttribute;
        if (props.tooltipForm && !hasEvent) {
            errorMessages.push("A tooltip requires event entity and event data attribute");
        }
        if (props.tooltipForm && props.tooltipMicroflow) {
            errorMessages.push("A tooltip requires a tooltip microflow");
        }
        if (props.onClickMicroflow && !hasEvent) {
            errorMessages.push("On click microflow requires event entity and event data attribute");
        }
        // TODO can we validate the context object of tooltip form to match the tooltip entity?

        return AnyChartContainer.renderError(props.friendlyId, errorMessages);
    }

    public static renderError(id: string, errorMessages: string[]) {
        if (errorMessages.length) {
            return createElement("div", {},
                `Configuration error in widget ${id}:`,
                errorMessages.map((message, key) => createElement("p", { key }, message))
            );
        }
        return "";
    }
}
