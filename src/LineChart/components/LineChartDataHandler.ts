import { Component, createElement } from "react";
import { MapDispatchToProps, MapStateToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";

import LineChart from "./LineChart";
import * as LineChartActions from "../store/LineChartActions";
import { LineChartInstanceState, ScatterReduxStore as ReduxStore, defaultInstanceState } from "../store/LineChartReducer";
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

import LineChartContainerProps = Container.LineChartContainerProps;
import { ChartType } from "../../utils/configs";

type Actions = typeof LineChartActions & typeof PlotlyChartActions;
export type LineChartDataHandlerProps = LineChartContainerProps & LineChartInstanceState & Actions;

export class LineChartDataHandler extends Component<LineChartDataHandlerProps> {
    private subscriptionHandles: number[] = [];
    private intervalID?: number;
    private typeMapping: { [ key in Container.ScatterTypes ]: ChartType } = {
        line: "LineChart",
        area: "AreaChart",
        bubble: "BubbleChart",
        timeseries: "TimeSeries",
        polar: "PolarChart"
    };

    render() {
        return createElement("div", { className: "widget-charts-wrapper" },
            createElement(LineChart, {
                ...this.props as LineChartDataHandlerProps,
                onClick: this.onClick,
                onHover: this.onHover,
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
        this.props.fetchThemeConfigs(friendlyId, this.typeMapping[this.props.type]);
    }

    componentWillReceiveProps(nextProps: LineChartDataHandlerProps) {
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

    shouldComponentUpdate(nextProps: LineChartDataHandlerProps) {
        const toggleFetching = nextProps.fetchingData !== this.props.fetchingData;
        const toggleUpdating = nextProps.updatingData !== this.props.updatingData;
        const playgroundLoaded = !!nextProps.playground && !this.props.playground;

        return toggleFetching || toggleUpdating || playgroundLoaded || !nextProps.mxObject;
    }

    componentWillUnmount() {
        this.unsubscribe();
        this.clearRefreshInterval();
    }

    private resetSubscriptions(props: LineChartDataHandlerProps) {
        this.unsubscribe();
        if (props.mxObject) {
            this.subscriptionHandles.push(mx.data.subscribe({
                callback: () => store.dispatch(props.fetchData(props)),
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

const mapStateToProps: MapStateToProps<LineChartInstanceState, LineChartContainerProps, ReduxStore> = (state, props) =>
    state.scatter[props.friendlyId] || defaultInstanceState as LineChartInstanceState;
const mapDispatchToProps: MapDispatchToProps<typeof LineChartActions & typeof PlotlyChartActions, LineChartContainerProps> =
    dispatch => ({
        ...bindActionCreators(LineChartActions, dispatch),
        ...bindActionCreators(PlotlyChartActions, dispatch)
    });
export default connect(mapStateToProps, mapDispatchToProps)(LineChartDataHandler);
