let __webpack_public_path__: string;
import { Component, ReactChild, createElement } from "react";

import { ChartConfigs, fetchThemeConfigs } from "../../utils/configs";
import { fetchByMicroflow, fetchData, generateRESTURL, handleOnClick, validateSeriesProps } from "../../utils/data";
import deepMerge from "deepmerge";
import { Container, Data } from "../../utils/namespaces";
import { PieChart, PieChartProps, PieTraces } from "./PieChart";
import { defaultColours, getDimensions, parseStyle } from "../../utils/style";
import { PieData } from "plotly.js";
import PieChartContainerProps = Container.PieChartContainerProps;

__webpack_public_path__ = window.mx ? `${window.mx.baseUrl}../widgets/` : "../widgets";

interface PieChartContainerState {
    alertMessage?: ReactChild;
    data: PieData[];
    loading?: boolean;
    themeConfigs: ChartConfigs;
}

export default class PieChartContainer extends Component<PieChartContainerProps, PieChartContainerState> {
    state: PieChartContainerState = {
        data: [],
        alertMessage: validateSeriesProps(
            [ { ...this.props, seriesOptions: this.props.dataOptions } ], this.props.friendlyId, this.props.layoutOptions
        ),
        loading: true,
        themeConfigs: { layout: {}, configuration: {}, data: {} }
    };
    private subscriptionHandle?: number;
    private intervalID?: number;

    render() {
        return createElement("div", {
            style: this.state.loading ? { ...getDimensions(this.props), ...parseStyle(this.props.style) } : undefined
        }, this.getContent());
    }

    componentDidMount() {
        if (this.props.devMode !== "basic") {
            fetchThemeConfigs("PieChart").then(themeConfigs => this.setState({ themeConfigs }));
        }
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
            themeConfigs: this.state.themeConfigs,
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

    private fetchData = (mxObject?: mendix.lib.MxObject) => {
        if (!this.state.loading) {
            this.setState({ loading: true });
        }
        const { dataEntity, dataSourceMicroflow, dataSourceType, entityConstraint, sortAttribute, sortOrder } = this.props;
        if (mxObject && dataEntity) {
            const attributes = [ this.props.nameAttribute, this.props.valueAttribute ];
            if (sortAttribute) {
                attributes.push(sortAttribute);
            }
            const url = this.props.restUrl && generateRESTURL(mxObject, this.props.restUrl, this.props.restParameters);

            fetchData<string>({
                guid: mxObject.getGuid(),
                entity: dataEntity,
                constraint: entityConstraint,
                sortAttribute,
                sortOrder,
                type: dataSourceType,
                attributes,
                microflow: dataSourceMicroflow,
                url
            }).then(data => {
                this.setState({ data: this.getData(data), loading: false });
            }).catch(error => {
                window.mx.ui.error(`An error occurred while retrieving data in ${this.props.friendlyId}:\n ${error.message}`);
                this.setState({ data: [], loading: false });
            });
        } else {
            this.setState({ loading: false, data: [] });
        }
    }

    private getData(data: Data.FetchedData<string>): PieData[] {
        if ((data.mxObjects && data.mxObjects.length) || (data.restData && data.restData.length)) {
            const advancedOptions = this.props.devMode !== "basic" && this.props.dataOptions
                ? JSON.parse(this.props.dataOptions)
                : {};

            const arrayMerge = (_destinationArray: any[], sourceArray: any[]) => sourceArray;

            const traces = this.getTraces(data);
            return [
                {
                    ...deepMerge.all(
                        [
                            PieChart.getDefaultDataOptions(this.props as PieChartProps),
                            {
                                labels: traces.labels,
                                values: traces.values,
                                marker: { colors: traces.colors }
                            },
                            advancedOptions
                        ],
                        { arrayMerge }
                    ),
                    customdata: data.mxObjects || []
                }
            ];
        }

        return [];
    }

    private getTraces(data: Data.FetchedData<string>): PieTraces {
        const colors = this.props.colors && this.props.colors.length
            ? this.props.colors.map(color => color.color)
            : defaultColours();
        if (data.mxObjects) {
            return {
                colors,
                labels: data.mxObjects.map(mxObject => mxObject.get(this.props.nameAttribute) as string),
                values: data.mxObjects.map(mxObject => parseFloat(mxObject.get(this.props.valueAttribute) as string))
            };
        }
        if (data.restData) {
            return {
                colors,
                labels: data.restData.map((point: any) => point[this.props.nameAttribute]),
                values: data.restData.map((point: any) => point[this.props.valueAttribute])
            };
        }

        return { labels: [], values: [], colors: [] };
    }

    private openTooltipForm(domNode: HTMLDivElement, dataObject: mendix.lib.MxObject) {
        const context = new mendix.lib.MxContext();
        context.setContext(dataObject.getEntity(), dataObject.getGuid());
        window.mx.ui.openForm(this.props.tooltipForm, { domNode, context });
    }
}

export { __webpack_public_path__ };
