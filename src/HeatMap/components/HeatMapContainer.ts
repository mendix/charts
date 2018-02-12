import { Component, ReactChild, createElement } from "react";

import { fetchByMicroflow, fetchByXPath, handleOnClick, validateSeriesProps } from "../../utils/data";
import { HeatMap } from "./HeatMap";
import { Container } from "../../utils/namespaces";
import { HeatMapData } from "plotly.js";
import HeatMapContainerProps = Container.HeatMapContainerProps;

interface HeatMapContainerState {
    alertMessage?: ReactChild;
    data?: HeatMapData;
    loading: boolean;
}

export default class HeatMapContainer extends Component<HeatMapContainerProps, HeatMapContainerState> {
    private subscriptionHandle?: number;
    private rawData: mendix.lib.MxObject[] = [];

    constructor(props: HeatMapContainerProps) {
        super(props);

        this.state = {
            alertMessage: validateSeriesProps([ { ...props, seriesOptions: props.dataOptions } ], props.friendlyId, props.layoutOptions),
            loading: true
        };
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

    private fetchData = (mxObject?: mendix.lib.MxObject) => {
        if (!this.state.loading) {
            this.setState({ loading: true });
        }
        const { dataEntity, dataSourceMicroflow, dataSourceType } = this.props;
        if (mxObject && dataEntity) {
            if (dataSourceType === "XPath") {
                this.fetchSortedData(mxObject);
            } else if (dataSourceType === "microflow" && dataSourceMicroflow) {
                fetchByMicroflow(dataSourceMicroflow, mxObject.getGuid())
                    .then(data => {
                        this.rawData = data;
                        const horizontalValues = this.getValues(data, this.props.horizontalNameAttribute);
                        const verticalValues = this.getValues(data, this.props.verticalNameAttribute);
                        this.setState({
                            data: {
                                x: horizontalValues,
                                y: verticalValues,
                                z: this.processZData(data, verticalValues, horizontalValues),
                                colorscale: HeatMapContainer.processColorScale(this.props.scaleColors),
                                showscale: this.props.showScale,
                                type: "heatmap"
                            },
                            loading: false
                        });
                    })
                    .catch(reason => {
                        window.mx.ui.error(`An error occurred while retrieving chart data: ${reason}`);
                        this.setState({ data: undefined, loading: false });
                    });
            }
        } else {
            this.setState({ loading: false, data: undefined });
        }
    }

    private fetchSortedData(mxObject: mendix.lib.MxObject) {
        const { dataEntity, entityConstraint, horizontalSortAttribute, horizontalSortOrder } = this.props;
        fetchByXPath(mxObject.getGuid(), dataEntity, entityConstraint, horizontalSortAttribute, horizontalSortOrder)
            .then(horizontalData => {
                this.rawData = horizontalData;
                const horizontalValues = this.getValues(horizontalData, this.props.horizontalNameAttribute);
                const { verticalSortAttribute, verticalSortOrder } = this.props;
                fetchByXPath(mxObject.getGuid(), dataEntity, entityConstraint, verticalSortAttribute, verticalSortOrder)
                    .then(verticalData => {
                        const verticalValues = this.getValues(verticalData, this.props.verticalNameAttribute);
                        this.setState({
                            loading: false,
                            data: {
                                x: horizontalValues,
                                y: verticalValues,
                                z: this.processZData(verticalData, verticalValues, horizontalValues),
                                colorscale: HeatMapContainer.processColorScale(this.props.scaleColors),
                                showscale: this.props.showScale,
                                type: "heatmap"
                            }
                        });
                    });

            })
            .catch(reason => {
                window.mx.ui.error(`An error occurred while retrieving sorted chart data: ${reason}`);
                this.setState({ data: undefined, loading: false });
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

    private handleOnClick = (x: string, y: string, z: number) => {
        const object = this.findSourceObject(x, y, z);
        if (object) {
            handleOnClick(this.props, object, this.props.mxform);
        } else {
            console.log("Couldn't find matching a object for the chart values"); // tslint:disable-line
        }
    }

    private findSourceObject(x: string, y: string, z: number): mendix.lib.MxObject | undefined {
        return this.rawData.find(data =>
            data.get(this.props.horizontalNameAttribute) === x &&
            data.get(this.props.verticalNameAttribute) === y &&
            Number(data.get(this.props.valueAttribute)) === z
        );
    }

    private openTooltipForm = (domNode: HTMLDivElement, x: string, y: string, z: number) => {
        const dataObject = this.findSourceObject(x, y, z);
        if (dataObject) {
            const context = new mendix.lib.MxContext();
            context.setContext(dataObject.getEntity(), dataObject.getGuid());
            window.mx.ui.openForm(this.props.tooltipForm, { domNode, context });
        } else {
            console.log("Failed to open tooltip: couldn't find matching object for the chart values"); // tslint:disable-line
        }
    }

    public static processColorScale(scaleColors: Container.ScaleColors[]): (string | number)[][] {
        return scaleColors.length > 1
            ? scaleColors.map(colors => [ Math.abs(colors.valuePercentage / 100), colors.colour ])
            : [ [ 0, "#17347B" ], [ 0.5, "#48B0F7" ], [ 1, "#76CA02" ] ];
    }
}
