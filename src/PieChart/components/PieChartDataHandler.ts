import { Component, createElement } from "react";

import { fetchData, generateRESTURL, handleOnClick, openTooltipForm, validateSeriesProps } from "../../utils/data";
import deepMerge from "deepmerge";
import { Container, Data } from "../../utils/namespaces";
import PieChart, { PieTraces } from "./PieChart";
import { defaultColours } from "../../utils/style";
import { PieData } from "plotly.js";
import PieChartContainerProps = Container.PieChartContainerProps;
import { MapDispatchToProps, MapStateToProps, connect } from "react-redux";
import { ReduxStore, store } from "../store";
import { PieChartState, defaultState } from "../store/PieChartReducer";
import * as PieChartActions from "../store/PieChartActions";
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";
import { bindActionCreators } from "redux";

// interface PieChartContainerState {
//     alertMessage?: ReactChild;
//     data: PieData[];
//     loading?: boolean;
//     themeConfigs: ChartConfigs;
// }

type Actions = typeof PieChartActions & typeof PlotlyChartActions;
export type PieChartDataHandlerProps = PieChartContainerProps & PieChartState & Actions;

export class PieChartDataHandler extends Component<PieChartDataHandlerProps> {
    // state: PieChartContainerState = {
    //     data: [],
    //     alertMessage: validateSeriesProps(
    //         [ { ...this.props, seriesOptions: this.props.dataOptions } ],
    //         this.props.friendlyId,
    //         this.props.layoutOptions,
    //         this.props.configurationOptions
    //     ),
    //     loading: true,
    //     themeConfigs: { layout: {}, configuration: {}, data: {} }
    // };
    private subscriptionHandles: number[] = [];
    private intervalID?: number;

    render() {
        return createElement("div", { className: "widget-charts-wrapper"
            // style: this.state.loading ? { ...getDimensions(this.props), ...parseStyle(this.props.style) } : undefined
        }, createElement(PieChart, {
            ...this.props as PieChartDataHandlerProps,
            onClick: this.handleOnClick,
            onHover: this.props.tooltipForm ? this.handleOnHover : undefined
        }));
    }

    componentDidMount() {
        const { friendlyId, layoutOptions, configurationOptions } = this.props;
        const validationError = validateSeriesProps(
            [ { ...this.props, seriesOptions: this.props.dataOptions } ],
            friendlyId,
            layoutOptions,
            configurationOptions
        );
        if (validationError) {
            this.props.showAlertMessage(friendlyId, validationError);
        }
        if (this.props.devMode !== "basic") {
            store.dispatch(this.props.fetchThemeConfigs(friendlyId));
        }
    }

    componentWillReceiveProps(newProps: PieChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        if (!this.props.alertMessage) {
            this.fetchData(newProps.mxObject);
            this.setRefreshInterval(newProps.refreshInterval, newProps.mxObject);
        }
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    private unsubscribe() {
        this.subscriptionHandles.map(mx.data.unsubscribe);
        this.subscriptionHandles = [];
        this.clearRefreshInterval();
    }

    private setRefreshInterval(refreshInterval: number, mxObject?: mendix.lib.MxObject) {
        if (refreshInterval > 0 && mxObject) {
            this.clearRefreshInterval();
            this.intervalID = window.setInterval(() => {
                if (!this.props.fetchingData) {
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

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        this.unsubscribe();

        if (mxObject) {
            this.subscriptionHandles.push(window.mx.data.subscribe({
                callback: () => this.fetchData(mxObject),
                guid: mxObject.getGuid()
            }));
        }
    }

    private fetchData = (mxObject?: mendix.lib.MxObject) => {
        // if (!this.state.loading) {
        //     this.setState({ loading: true });
        // }
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
                sortAttribute: sortAttribute || this.props.nameAttribute,
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
        if (data.mxObjects) {
            data.mxObjects.forEach(mxObject => {
                this.subscriptionHandles.push(mx.data.subscribe({
                    callback: () => {/* callback is required but not in this case */},
                    guid: mxObject.getGuid()
                }));
            });
        }
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
                            // PieChart.getDefaultDataOptions(this.props as PieChartProps),
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

    private handleOnClick = (options: Data.OnClickOptions<{ label: string, value: number }, PieChartContainerProps>) => {
        if (options.mxObject) {
            handleOnClick(options.options, options.mxObject, options.mxForm);
        } else if (options.trace) {
            this.createDataPoint(options.options, options.trace)
                .then(mxObject => handleOnClick(options.options, mxObject, options.mxForm))
                .catch(error => mx.ui.error(`An error occured while creating ${options.options.dataEntity} object: ${error}`));
        }
    }

    private handleOnHover = (options: Data.OnHoverOptions<{ label: string, value: number }, PieChartContainerProps>) => {
        if (options.mxObject) {
            openTooltipForm(options.tooltipNode, options.tooltipForm, options.mxObject);
        } else if (options.trace && options.options.dataEntity) {
            this.createDataPoint(options.options, options.trace)
                .then(mxObject => openTooltipForm(options.tooltipNode, options.tooltipForm, mxObject))
                .catch(error => mx.ui.error(`An error occured while creating ${options.options.dataEntity} object: ${error}`));
        }
    }

    private createDataPoint(props: PieChartContainerProps, trace: { label: string, value: number }) {
        return new Promise<mendix.lib.MxObject>((resolve, reject) => {
            window.mx.data.create({
                entity: props.dataEntity,
                callback: mxObject => {
                    mxObject.set(props.nameAttribute, trace.label);
                    mxObject.set(props.valueAttribute, trace.value);
                    resolve(mxObject);
                },
                error: error => reject(error.message)
            });
        });
    }
}

const mapStateToProps: MapStateToProps<PieChartState, PieChartContainerProps, ReduxStore> = (state, props) =>
    state.pie[props.friendlyId] || defaultState as PieChartState;
const mapDispatchToProps: MapDispatchToProps<typeof PieChartActions & typeof PlotlyChartActions, PieChartContainerProps> =
    dispatch => ({
        ...bindActionCreators(PieChartActions, dispatch),
        ...bindActionCreators(PlotlyChartActions, dispatch)
    });
export default connect(mapStateToProps, mapDispatchToProps)(PieChartDataHandler);
