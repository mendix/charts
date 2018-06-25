import { Component, createElement } from "react";
import { MapDispatchToProps, MapStateToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";

import BarChart from "./BarChart";
import * as BarChartActions from "../store/BarChartActions";
import { BarChartInstanceState, BarReduxStore as ReduxStore, defaultInstanceState } from "../store/BarChartReducer";
import {
    handleOnClick,
    isContextChanged,
    openTooltipForm,
    setRefreshAction,
    validateSeriesProps
} from "../../utils/data";
import { Container, Data } from "../../utils/namespaces";
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";
import { store } from "../../store";

import BarChartContainerProps = Container.BarChartContainerProps;

type Actions = typeof BarChartActions & typeof PlotlyChartActions;
export type BarChartDataHandlerProps = BarChartContainerProps & BarChartInstanceState & Actions;

export class BarChartDataHandler extends Component<BarChartDataHandlerProps> {
    private subscriptionHandles: number[] = [];
    private intervalID?: number;

    render() {
        return createElement("div", { className: "widget-charts-wrapper" },
            createElement(BarChart, {
                ...this.props as BarChartDataHandlerProps,
                onClick: this.onClick,
                onHover: this.onHover,
                scatterData: this.props.scatterData,
                series: this.props.seriesData ? this.props.seriesData.map(({ series }) => series) : this.props.series
            })
        );
    }

    componentDidMount() {
        const { series, friendlyId, layoutOptions, configurationOptions } = this.props;
        const validationError = validateSeriesProps(series, friendlyId, layoutOptions, configurationOptions);
        if (validationError) {
            this.props.showAlertMessage(friendlyId, validationError);
        }
        this.props.fetchThemeConfigs(friendlyId, this.props.orientation);
    }

    componentWillReceiveProps(nextProps: BarChartDataHandlerProps) {
        this.resetSubscriptions(nextProps);
        if (!nextProps.alertMessage) {
            if (!nextProps.mxObject) {
                if (this.props.mxObject) {
                    nextProps.noContext(nextProps.friendlyId);
                }
            } else if (!nextProps.fetchingConfigs && isContextChanged(this.props.mxObject, nextProps.mxObject)) {
                if (!nextProps.fetchingData) {
                    store.dispatch(nextProps.fetchData(nextProps));
                }
                this.clearRefreshInterval();
                this.intervalID = setRefreshAction(nextProps.refreshInterval, nextProps.mxObject)(this.onRefresh);
            }
        } else {
            this.clearRefreshInterval();
        }
    }

    shouldComponentUpdate(nextProps: BarChartDataHandlerProps) {
        const toggleFetching = nextProps.fetchingData !== this.props.fetchingData;
        const toggleUpdating = nextProps.updatingData !== this.props.updatingData;
        const playgroundLoaded = !!nextProps.playground && !this.props.playground;

        return toggleFetching || toggleUpdating || playgroundLoaded || !nextProps.mxObject;
    }

    componentWillUnmount() {
        this.unsubscribe();
        this.clearRefreshInterval();
    }

    private resetSubscriptions(props: BarChartDataHandlerProps) {
        this.unsubscribe();
        if (props.mxObject) {
            this.subscriptionHandles.push(mx.data.subscribe({
                callback: () => store.dispatch(this.props.fetchData(this.props)),
                guid: props.mxObject.getGuid()
            }));
        }
        if (props.seriesData && props.seriesData.length) {
            props.seriesData.forEach(({ data: mxObjects }) => {
                if (mxObjects) {
                    mxObjects.forEach(mxObject =>
                        this.subscriptionHandles.push(mx.data.subscribe({
                            callback: () => {/* callback is required but not in this case */},
                            guid: mxObject.getGuid()
                        }))
                    );
                }
            });
        }
    }

    private unsubscribe() {
        this.subscriptionHandles.map(mx.data.unsubscribe);
        this.subscriptionHandles = [];
    }

    private onRefresh = () => {
        if (!this.props.fetchingData) {
            store.dispatch(this.props.fetchData(this.props));
        }
    }

    private onClick = (options: Data.OnClickOptions<{ x: string, y: number }, Data.SeriesProps>) => {
        if (options.mxObject) {
            handleOnClick(options.options, options.mxObject, options.mxForm);
        } else if (options.trace) {
            this.createDataPoint(options.options, options.trace)
                .then(mxObject => handleOnClick(options.options, mxObject, options.mxForm))
                .catch(error => mx.ui.error(`An error occured while creating ${options.options.dataEntity} object: ${error}`));
        }
    }

    private onHover = (options: Data.OnHoverOptions<{ x: string, y: number }, Data.SeriesProps>) => {
        if (options.mxObject) {
            openTooltipForm(options.tooltipNode, options.tooltipForm, options.mxObject);
        } else if (options.trace && options.options.dataEntity) {
            this.createDataPoint(options.options, options.trace)
                .then(mxObject => openTooltipForm(options.tooltipNode, options.tooltipForm, mxObject))
                .catch(error => mx.ui.error(`An error occured while creating ${options.options.dataEntity} object: ${error}`));
        }
    }

    private createDataPoint(seriesProps: Data.SeriesProps, trace: { x: string, y: number }) {
        return new Promise<mendix.lib.MxObject>((resolve, reject) => {
            window.mx.data.create({
                entity: seriesProps.dataEntity,
                callback: mxObject => {
                    mxObject.set(seriesProps.xValueAttribute, trace.x);
                    mxObject.set(seriesProps.yValueAttribute, trace.y);
                    resolve(mxObject);
                },
                error: error => reject(error.message)
            });
        });
    }

    private clearRefreshInterval() {
        window.clearInterval(this.intervalID);
        this.intervalID = undefined;
    }
}

const mapStateToProps: MapStateToProps<BarChartInstanceState, BarChartContainerProps, ReduxStore> = (state, props) =>
    state.bar[props.friendlyId] || defaultInstanceState as BarChartInstanceState;
const mapDispatchToProps: MapDispatchToProps<typeof BarChartActions & typeof PlotlyChartActions, BarChartContainerProps> =
    dispatch => ({
        ...bindActionCreators(BarChartActions, dispatch),
        ...bindActionCreators(PlotlyChartActions, dispatch)
    });
export default connect(mapStateToProps, mapDispatchToProps)(BarChartDataHandler);
