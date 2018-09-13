import { Component, createElement } from "react";

import {
    handleOnClick,
    isContextChanged,
    openTooltipForm,
    setRefreshAction,
    validateSeriesProps
} from "../../utils/data";
import HeatMap from "./HeatMap";
import { Container, Data } from "../../utils/namespaces";
import HeatMapContainerProps = Container.HeatMapContainerProps;
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";
import * as HeatMapActions from "../store/HeatMapActions";
import { HeatMapReduxStore as ReduxStore, HeatMapState, defaultInstanceState } from "../store/HeatMapReducer";
import { store } from "../../store";
import { MapDispatchToProps, MapStateToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";
import { getAttributeName } from "../utils/data";

type Actions = typeof HeatMapActions & typeof PlotlyChartActions;
type ComponentProps = HeatMapContainerProps & { instanceID: string };
export type HeatMapDataHandlerProps = ComponentProps & HeatMapState & Actions;

class HeatMapDataHandler extends Component<HeatMapDataHandlerProps> {
    private subscriptionHandles: number[] = [];
    private intervalID?: number;
    private isRunningAction = false;
    private showProgress?: number;
    readonly onStopActionbound = this.onStopAction.bind(this);

    render() {
        return createElement("div", { className: "widget-charts-wrapper" },
            createElement(HeatMap, {
                ...this.props as HeatMapDataHandlerProps,
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

    componentWillReceiveProps(nextProps: HeatMapDataHandlerProps) {
        this.resetSubscriptions(nextProps);
        if (!nextProps.alertMessage) {
            if (!nextProps.mxObject) {
                if (this.props.mxObject) {
                    nextProps.noContext(nextProps.instanceID);
                }
            } else if (isContextChanged(this.props.mxObject, nextProps.mxObject)) {
                if (!nextProps.fetchingData) {
                    store.dispatch(nextProps.fetchHeatMapData(nextProps));
                }
                this.clearRefreshInterval();
                this.intervalID = setRefreshAction(nextProps.refreshInterval, nextProps.mxObject)(this.onRefresh);
            }
        } else {
            this.clearRefreshInterval();
        }
    }

    shouldComponentUpdate(nextProps: HeatMapDataHandlerProps) {
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
            store.dispatch(this.props.fetchHeatMapData(this.props));
        }
    }

    private clearRefreshInterval() {
        if (this.intervalID) {
            window.clearInterval(this.intervalID);
        }
    }

    private resetSubscriptions(props: HeatMapDataHandlerProps) {
        this.unsubscribe();

        if (props.mxObject) {
            this.subscriptionHandles.push(window.mx.data.subscribe({
                callback: () => store.dispatch(this.props.fetchHeatMapData(props)),
                guid: props.mxObject.getGuid()
            }));
        }
        if (props.mxObjects && props.mxObjects) {
            props.mxObjects.forEach(mxObject => {
                if (mxObject) {
                    this.subscriptionHandles.push(mx.data.subscribe({
                        callback: () => {/* callback is required but not in this case */},
                        guid: mxObject.getGuid()
                    }));
                }
            });
        }
    }

    private handleOnClick = (options: Data.OnClickOptions<{ x: string, y: string, z: number }, HeatMapContainerProps>) => {
        if (!this.isRunningAction && options.trace) {
            this.onStartAction();
            const mxObject = this.findSourceObject(options.trace.x, options.trace.y, options.trace.z);

            if (mxObject) {
                handleOnClick(options.options, options.mxObject, options.mxForm)
                    .then(this.onStopActionbound)
                    .catch((error) => {
                        mx.ui.error(error);
                        this.onStopActionbound();
                    });
            } else {
                this.createDataPoint(options.options, options.trace)
                    .then(newMxObject => {
                        handleOnClick(options.options, newMxObject, options.mxForm)
                            .then(this.onStopActionbound)
                            .catch(error => {
                                mx.ui.error(error);
                                this.onStopActionbound();
                            });
                    })
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
        return this.props.mxObjects && this.props.mxObjects.find(data =>
            data.get(getAttributeName(this.props.horizontalNameAttribute)) === x &&
            data.get(getAttributeName(this.props.verticalNameAttribute)) === y &&
            Number(data.get(this.props.valueAttribute)) === z
        );
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

const mapStateToProps: MapStateToProps<HeatMapState, ComponentProps, ReduxStore> = (state, props) =>
    state.heatmap[props.instanceID] || defaultInstanceState as HeatMapState;
const mapDispatchToProps: MapDispatchToProps<typeof HeatMapActions & typeof PlotlyChartActions, ComponentProps> =
    dispatch => ({
        ...bindActionCreators(HeatMapActions, dispatch),
        ...bindActionCreators(PlotlyChartActions, dispatch)
    });
export default connect(mapStateToProps, mapDispatchToProps)(HeatMapDataHandler);
