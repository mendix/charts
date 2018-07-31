import { Component, createElement } from "react";
import { MapDispatchToProps, MapStateToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";

import { handleOnClick, isContextChanged, openTooltipForm, setRefreshAction, validateSeriesProps } from "../../utils/data";
import { Container, Data } from "../../utils/namespaces";
import PieChart from "./PieChart";
import * as PieChartActions from "../store/PieChartActions";
import { PieChartState, PieReduxStore as ReduxStore, defaultInstanceState } from "../store/PieChartReducer";
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";
import { store } from "../../store";
import PieChartContainerProps = Container.PieChartContainerProps;

type Actions = typeof PieChartActions & typeof PlotlyChartActions;
type ComponentProps = PieChartContainerProps & { instanceID: string };
export type PieChartDataHandlerProps = ComponentProps & PieChartState & Actions;

export class PieChartDataHandler extends Component<PieChartDataHandlerProps> {
    private subscriptionHandles: number[] = [];
    private intervalID?: number;
    private isRunningAction = false;
    private showProgress?: number;
    readonly onStopActionbound = this.onStopAction.bind(this);

    render() {
        return createElement("div", { className: "widget-charts-wrapper" },
            createElement(PieChart, {
                ...this.props as PieChartDataHandlerProps,
                onClick: this.handleOnClick,
                onHover: this.props.tooltipForm ? this.handleOnHover : undefined
            })
        );
    }

    componentDidMount() {
        const { friendlyId, instanceID, layoutOptions, configurationOptions } = this.props;
        const validationError = validateSeriesProps(
            [ { ...this.props, seriesOptions: this.props.dataOptions } ],
            friendlyId,
            layoutOptions,
            configurationOptions
        );
        if (validationError) {
            this.props.showAlertMessage(instanceID, validationError);
        }
        store.dispatch(this.props.fetchThemeConfigs(instanceID));
    }

    componentWillReceiveProps(nextProps: PieChartDataHandlerProps) {
        this.resetSubscriptions(nextProps);
        if (!nextProps.alertMessage) {
            if (!nextProps.mxObject) {
                if (this.props.mxObject) {
                    nextProps.noContext(nextProps.instanceID);
                }
            } else if (isContextChanged(this.props.mxObject, nextProps.mxObject)) {
                if (!nextProps.fetchingData) {
                    store.dispatch(nextProps.fetchPieData(nextProps));
                }
                this.clearRefreshInterval();
                this.intervalID = setRefreshAction(nextProps.refreshInterval, nextProps.mxObject)(this.onRefresh);
            }
        } else {
            this.clearRefreshInterval();
        }
    }

    shouldComponentUpdate(nextProps: PieChartDataHandlerProps) {
        const toggleFetching = nextProps.fetchingData !== this.props.fetchingData;
        const toggleUpdating = nextProps.updatingData !== this.props.updatingData;
        const playgroundLoaded = !!nextProps.playground && !this.props.playground;

        return toggleFetching || toggleUpdating || playgroundLoaded || !nextProps.mxObject;
    }

    componentWillUnmount() {
        this.unsubscribe();
        this.clearRefreshInterval();
    }

    private unsubscribe() {
        this.subscriptionHandles.map(mx.data.unsubscribe);
        this.subscriptionHandles = [];
    }

    private onRefresh = () => {
        if (!this.props.fetchingData) {
            store.dispatch(this.props.fetchPieData(this.props));
        }
    }

    private clearRefreshInterval() {
        if (this.intervalID) {
            window.clearInterval(this.intervalID);
        }
    }

    private resetSubscriptions(props: PieChartDataHandlerProps) {
        this.unsubscribe();

        if (props.mxObject) {
            this.subscriptionHandles.push(window.mx.data.subscribe({
                callback: () => store.dispatch(this.props.fetchPieData(props)),
                guid: props.mxObject.getGuid()
            }));
        }
        if (props.data && props.data.length) {
            props.data.forEach(mxObject => {
                if (mxObject) {
                    this.subscriptionHandles.push(mx.data.subscribe({
                        callback: () => {/* callback is required but not in this case */},
                        guid: mxObject.getGuid()
                    }));
                }
            });
        }
    }

    private handleOnClick = (options: Data.OnClickOptions<{ label: string, value: number }, PieChartContainerProps>) => {
        if (!this.isRunningAction) {
            this.onStartAction();
            if (options.mxObject) {
                handleOnClick(options.options, options.mxObject, options.mxForm)
                    .then(this.onStopActionbound)
                    .catch((error) => {
                        mx.ui.error(error);
                        this.onStopActionbound();
                    });
            } else if (options.trace) {
                this.createDataPoint(options.options, options.trace)
                    .then(mxObject => {
                        handleOnClick(options.options, mxObject, options.mxForm)
                            .then(this.onStopActionbound)
                            .catch((error) => {
                                mx.ui.error(error);
                                this.onStopActionbound();
                            });
                    })
                    .catch(error => mx.ui.error(`An error occured while creating ${options.options.dataEntity} object: ${error}`));
            }
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

    private onStartAction() {
        this.isRunningAction = true;
        setTimeout(() => {
            if (this.isRunningAction) {
                this.showProgress = mx.ui.showProgress();
            }
        } , 120);
    }
    private onStopAction() {
        this.isRunningAction = false;
        if (this.showProgress) {
            mx.ui.hideProgress(this.showProgress);
        }

    }
}

const mapStateToProps: MapStateToProps<PieChartState, ComponentProps, ReduxStore> = (state, props) =>
    state.pie[props.instanceID] || defaultInstanceState as PieChartState;
const mapDispatchToProps: MapDispatchToProps<typeof PieChartActions & typeof PlotlyChartActions, ComponentProps> =
    dispatch => ({
        ...bindActionCreators(PieChartActions, dispatch),
        ...bindActionCreators(PlotlyChartActions, dispatch)
    });
export default connect(mapStateToProps, mapDispatchToProps)(PieChartDataHandler);
