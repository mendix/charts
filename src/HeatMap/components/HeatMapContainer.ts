let __webpack_public_path__: string;
import { Component, ReactChild, createElement } from "react";

import {
    fetchByMicroflow,
    fetchByXPath,
    fetchData,
    generateRESTURL,
    handleOnClick,
    openTooltipForm,
    validateSeriesProps
} from "../../utils/data";
import { HeatMap } from "./HeatMap";
import { Container, Data } from "../../utils/namespaces";
import { HeatMapData } from "plotly.js";
import { getDimensions, parseStyle } from "../../utils/style";
import HeatMapContainerProps = Container.HeatMapContainerProps;
import { ChartConfigs, fetchThemeConfigs } from "../../utils/configs";

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

interface HeatMapContainerState {
    alertMessage?: ReactChild;
    data?: HeatMapData;
    loading: boolean;
    themeConfigs: ChartConfigs;
}

export default class HeatMapContainer extends Component<HeatMapContainerProps, HeatMapContainerState> {
    state: HeatMapContainerState = {
        alertMessage: validateSeriesProps(
            [ { ...this.props, seriesOptions: this.props.dataOptions } ], this.props.friendlyId, this.props.layoutOptions
        ),
        loading: true,
        themeConfigs: { layout: {}, configuration: {}, data: {} }
    };
    private subscriptionHandle?: number;
    private rawData: mendix.lib.MxObject[] = [];
    private intervalID?: number;

    render() {
        return createElement("div", {
            style: this.state.loading ? { ...getDimensions(this.props), ...parseStyle(this.props.style) } : undefined
        }, this.getContent());
    }

    componentDidMount() {
        if (this.props.devMode !== "basic") {
            fetchThemeConfigs("HeatMap").then(themeConfigs => this.setState({ themeConfigs }));
        }
    }

    componentWillReceiveProps(newProps: HeatMapContainerProps) {
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
        return createElement(HeatMap, {
            ...this.props as HeatMapContainerProps,
            alertMessage: this.state.alertMessage,
            loading: this.state.loading,
            data: this.state.data,
            themeConfigs: this.state.themeConfigs,
            onClick: this.handleOnClick,
            onHover: this.props.tooltipForm ? this.handleOnHover : undefined
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
        const { dataEntity, dataSourceMicroflow, dataSourceType, restUrl } = this.props;
        if (mxObject && dataEntity) {
            if (dataSourceType === "XPath") {
                this.fetchSortedData(mxObject);
            } else if (dataSourceType === "microflow" && dataSourceMicroflow) {
                fetchByMicroflow(dataSourceMicroflow, mxObject.getGuid())
                    .then(data => {
                        this.rawData = data;
                        const horizontalValues = this.getValues(this.props.horizontalNameAttribute, data);
                        const verticalValues = this.getValues(this.props.verticalNameAttribute, data);
                        this.setState({
                            data: {
                                x: horizontalValues,
                                y: verticalValues,
                                z: this.processZData(verticalValues, horizontalValues, data),
                                zsmooth: this.props.smoothColor ? "best" : false,
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
            } else if (dataSourceType === "REST" && restUrl) {
                const attributes = [
                    this.props.valueAttribute,
                    this.props.horizontalNameAttribute,
                    this.props.verticalNameAttribute
                ];
                if (this.props.horizontalSortAttribute) {
                    attributes.push(this.props.horizontalSortAttribute);
                }
                if (this.props.verticalSortAttribute) {
                    attributes.push(this.props.verticalSortAttribute);
                }
                const url = this.props.restUrl && generateRESTURL(mxObject, this.props.restUrl, this.props.restParameters);
                fetchData<string>({
                    guid: mxObject.getGuid(),
                    entity: dataEntity,
                    type: "REST",
                    attributes,
                    url
                }).then(data => {
                    const x = this.getValues(this.props.horizontalNameAttribute, [], data.restData);
                    const y = this.getValues(this.props.verticalNameAttribute, [], data.restData);
                    this.setState({
                        data: {
                            x,
                            y,
                            z: this.processZData(y, x, [], data.restData),
                            zsmooth: this.props.smoothColor ? "best" : false,
                            colorscale: HeatMapContainer.processColorScale(this.props.scaleColors),
                            showscale: this.props.showScale,
                            type: "heatmap"
                        },
                        loading: false
                    });
                }).catch(error => {
                    window.mx.ui.error(`An error occurred while retrieving data in ${this.props.friendlyId}:\n ${error.message}`);
                    this.setState({ data: undefined, loading: false });
                });
            }
        } else {
            this.setState({ loading: false, data: undefined });
        }
    }

    private fetchSortedData(mxObject: mendix.lib.MxObject) {
        const { dataEntity, entityConstraint, horizontalSortAttribute, horizontalSortOrder } = this.props;
        const fetchOptions = {
            guid: mxObject.getGuid(),
            entity: dataEntity,
            constraint: entityConstraint
        };
        fetchByXPath({
            ...fetchOptions,
            sortAttribute: horizontalSortAttribute,
            sortOrder: horizontalSortOrder
        }).then(horizontalData => {
            this.rawData = horizontalData;
            const horizontalValues = this.getValues(this.props.horizontalNameAttribute, horizontalData);
            const { verticalSortAttribute, verticalSortOrder } = this.props;
            fetchByXPath({
                ...fetchOptions,
                sortAttribute: verticalSortAttribute,
                sortOrder: verticalSortOrder
            }).then(verticalData => {
                const verticalValues = this.getValues(this.props.verticalNameAttribute, verticalData);
                this.setState({
                    loading: false,
                    data: {
                        x: horizontalValues,
                        y: verticalValues,
                        z: this.processZData(verticalValues, horizontalValues, verticalData),
                        zsmooth: this.props.smoothColor ? "best" : false,
                        colorscale: HeatMapContainer.processColorScale(this.props.scaleColors),
                        showscale: this.props.showScale,
                        type: "heatmap"
                    }
                });
            });
        }).catch(reason => {
            window.mx.ui.error(`An error occurred while retrieving sorted chart data: ${reason}`);
            this.setState({ data: undefined, loading: false });
        });
    }

    private processZData(vertical: string[], horizontal: string[], data: mendix.lib.MxObject[], restData?: Data.RESTData): number[][] {
        const verticalAttribute = this.getAttributeName(this.props.verticalNameAttribute);
        const horizontalAttribute = this.getAttributeName(this.props.horizontalNameAttribute);

        if (data && data.length) {
            return vertical.map(verticalValues =>
                horizontal.map(horizontalValues => {
                    const zData = data.find(value =>
                        value.get(verticalAttribute) === verticalValues &&
                        value.get(horizontalAttribute) === horizontalValues
                    );

                    return zData ? Number(zData.get(this.props.valueAttribute)) : 0;
                })
            );
        } else if (restData && restData.length) {
            return vertical.map(verticalValues =>
                horizontal.map(horizontalValues => {
                    const zData = restData.find(value =>
                        value[verticalAttribute] === verticalValues &&
                        value[horizontalAttribute] === horizontalValues
                    );

                    return zData ? Number(zData[this.props.valueAttribute]) : 0;
                })
            );
        }

        return [];
    }

    private getAttributeName(attributePath: string): string {
        const attributeSplit = attributePath.split("/");

        return attributeSplit[attributeSplit.length - 1];
    }

    private getValues(attribute: string, data: mendix.lib.MxObject[], restData?: Data.RESTData): string[] {
        const values: string[] = [];
        const attributeName = this.getAttributeName(attribute);
        if (data && data.length) {
            data.forEach(item => {
                const value = item.get(attributeName) as string;
                if (values.indexOf(value) === -1) {
                    values.push(value);
                }
            });
        } else if (restData && restData.length) {
            restData.forEach(item => {
                const value = item[attributeName] as string;
                if (values.indexOf(value) === -1) {
                    values.push(value);
                }
            });
        }

        return values;
    }

    private handleOnClick = (options: Data.OnClickOptions<{ x: string, y: string, z: number }, HeatMapContainerProps>) => {
        if (options.trace) {
            const mxObject = this.findSourceObject(options.trace.x, options.trace.y, options.trace.z);
            if (mxObject) {
                handleOnClick(options.options, mxObject, options.mxForm);
            } else {
                this.createDataPoint(options.options, options.trace)
                    .then(newMxObject => handleOnClick(options.options, newMxObject, options.mxForm))
                    .catch(error => mx.ui.error(`An error occured while creating ${options.options.dataEntity} object: ${error}`));
            }
        }
    }

    private handleOnHover = (options: Data.OnHoverOptions<{ x: string, y: string, z: number }, HeatMapContainerProps>) => {
        if (options.trace) {
            const mxObject = this.findSourceObject(options.trace.x, options.trace.y, options.trace.z);
            if (mxObject) {
                openTooltipForm(options.tooltipNode, options.tooltipForm, mxObject);
            } else {
                this.createDataPoint(options.options, options.trace)
                    .then(newMxObject => openTooltipForm(options.tooltipNode, options.tooltipForm, newMxObject))
                    .catch(error => mx.ui.error(`An error occured while creating ${options.options.dataEntity} object: ${error}`));
            }
        }
    }

    private createDataPoint(props: HeatMapContainerProps, trace: { x: string, y: string, z: number }) {
        return new Promise<mendix.lib.MxObject>((resolve, reject) => {
            window.mx.data.create({
                entity: props.dataEntity,
                callback: mxObject => {
                    mxObject.set(props.horizontalNameAttribute, trace.x);
                    mxObject.set(props.verticalNameAttribute, trace.y);
                    mxObject.set(props.valueAttribute, trace.z);
                    resolve(mxObject);
                },
                error: error => reject(error.message)
            });
        });
    }

    private findSourceObject(x: string, y: string, z: number): mendix.lib.MxObject | undefined {
        return this.rawData.find(data =>
            data.get(this.getAttributeName(this.props.horizontalNameAttribute)) === x &&
            data.get(this.getAttributeName(this.props.verticalNameAttribute)) === y &&
            Number(data.get(this.props.valueAttribute)) === z
        );
    }

    public static processColorScale(scaleColors: Container.ScaleColors[]): (string | number)[][] {
        return scaleColors.length > 1
            ? scaleColors
                .sort((colour1, colour2) => colour1.valuePercentage - colour2.valuePercentage)
                .map(colors => [ Math.abs(colors.valuePercentage / 100), colors.colour ])
            : [ [ 0, "#17347B" ], [ 0.5, "#0595DB" ], [ 1, "#76CA02" ] ];
    }
}

export { __webpack_public_path__ };
