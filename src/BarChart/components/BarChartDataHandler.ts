import { Component, createElement } from "react";
import { MapDispatchToProps, MapStateToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";

import BarChart from "./BarChart";
import * as BarChartActions from "../store/BarChartActions";
import { BarChartInstanceState, defaultInstanceState } from "../store/BarChartReducer";
import {
    handleOnClick,
    isContextChanged,
    openTooltipForm,
    setRefreshAction,
    validateSeriesProps
} from "../../utils/data";
import { Container, Data } from "../../utils/namespaces";
import * as PlotlyChartActions from "../../components/actions/PlotlyChartActions";
import { ReduxStore, store } from "../store";

import BarChartContainerProps = Container.BarChartContainerProps;

export type BarChartDataHandlerProps = BarChartContainerProps & BarChartInstanceState & typeof BarChartActions & typeof PlotlyChartActions;

export class BarChartDataHandler extends Component<BarChartDataHandlerProps> {
    private subscriptionHandle?: number;
    private intervalID?: number;

    render() {
        return createElement("div", { className: "widget-charts-wrapper" },
            createElement(BarChart, {
                ...this.props as BarChartDataHandlerProps,
                onClick: this.onClick,
                onHover: this.onHover,
                scatterData: this.props.scatterData,
                series: this.props.data ? this.props.data.map(({ series }) => series) : this.props.series
            })
        );
    }

    componentDidMount() {
        const { series, friendlyId, layoutOptions, configurationOptions } = this.props;
        const validationError = validateSeriesProps(series, friendlyId, layoutOptions, configurationOptions);
        if (validationError) {
            this.props.showAlertMessage(friendlyId, validationError);
        }
        if (this.props.devMode !== "basic") {
            store.dispatch(this.props.fetchThemeConfigs(friendlyId, this.props.orientation));
        }
    }

    componentWillReceiveProps(newProps: BarChartDataHandlerProps) {
        this.resetSubscriptions(newProps.mxObject);
        if (!newProps.alertMessage) {
            if (!newProps.mxObject) {
                newProps.noContext(newProps.friendlyId);
            } else if (!newProps.fetchingConfigs && isContextChanged(this.props.mxObject, newProps.mxObject)) {
                newProps.togglePlotlyDataLoading(newProps.friendlyId, true);
                store.dispatch(newProps.fetchData(newProps));
                this.clearRefreshInterval();
                this.intervalID = setRefreshAction(newProps.refreshInterval, newProps.mxObject)(this.onRefresh);
            }
        } else {
            this.clearRefreshInterval();
        }
    }

    shouldComponentUpdate(nextProps: BarChartDataHandlerProps) {
        const doneLoading = !nextProps.fetchingData && this.props.fetchingData;
        const advancedOptionsUpdated = nextProps.layoutOptions !== this.props.layoutOptions
            || nextProps.seriesOptions.join(" ") !== this.props.seriesOptions.join(" ")
            || nextProps.configurationOptions !== this.props.configurationOptions;
        const playgroundLoaded = !!nextProps.playground && !this.props.playground;

        return doneLoading || advancedOptionsUpdated || playgroundLoaded || !nextProps.mxObject;
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        this.unsubscribe();
        if (mxObject) {
            this.subscriptionHandle = mx.data.subscribe({
                callback: () => store.dispatch(this.props.fetchData(this.props)),
                guid: mxObject.getGuid()
            });
        }
    }

    private unsubscribe() {
        if (this.subscriptionHandle) {
            mx.data.unsubscribe(this.subscriptionHandle);
            this.subscriptionHandle = undefined;
        }
        this.clearRefreshInterval();
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
