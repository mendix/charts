import { Component, createElement } from "react";
import { MapDispatchToProps, MapStateToProps, connect } from "react-redux";
import { bindActionCreators } from "redux";
import { handleOnClick, isContextChanged, openTooltipForm, setRefreshAction, validateSeriesProps } from "../../utils/data";
import { Container, Data } from "../../utils/namespaces";
import * as BarChartContainerActions from "../store/BarChartActions";
import { BarChartInstanceState, defaultInstanceState } from "../store/BarChartReducer";
import { ReduxStore, store } from "../store/store";
import { ReduxBarChart } from "./BarChart";

import BarChartContainerProps = Container.BarChartContainerProps;

export type BarChartDataHandlerProps = BarChartContainerProps & BarChartInstanceState & typeof BarChartContainerActions;

export class BarChartDataHandler extends Component<BarChartDataHandlerProps> {
    private subscriptionHandle?: number;
    private intervalID?: number;

    render() {
        return createElement("div", { className: "widget-charts-wrapper" },
            createElement(ReduxBarChart, {
                ...this.props as BarChartDataHandlerProps,
                onClick: this.handleOnClick,
                onHover: this.handleOnHover,
                scatterData: this.props.scatterData,
                series: this.props.data ? this.props.data.map(({ series }) => series) : this.props.series
            })
        );
    }

    componentDidMount() {
        this.props.initialiseInstanceState(this.props.friendlyId);
        const validationError = validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions);
        if (validationError) {
            this.props.showAlertMessage(this.props.friendlyId, validationError);
        }
        if (this.props.devMode !== "basic") {
            this.props.fetchThemeConfigs(this.props.friendlyId, this.props.orientation);
        }
    }

    componentWillReceiveProps(newProps: BarChartDataHandlerProps) {
        this.resetSubscriptions(newProps.mxObject);
        if (!newProps.alertMessage) {
            if (!this.props.mxObject && !newProps.mxObject && newProps.fetchingData) {
                newProps.isFetching(newProps.friendlyId, false);
            } else if (!newProps.fetchingConfigs && isContextChanged(this.props.mxObject, newProps.mxObject)) {
                store.dispatch(newProps.fetchData(newProps));
                this.clearRefreshInterval();
                this.intervalID = setRefreshAction(newProps.refreshInterval, newProps.mxObject)(this.onRefresh);
            }
        } else {
            this.clearRefreshInterval();
        }
    }

    shouldComponentUpdate(nextProps: BarChartDataHandlerProps) {
        return nextProps.fetchingData !== this.props.fetchingData
            || nextProps.playground !== this.props.playground
            || nextProps.layoutOptions !== this.props.layoutOptions
            || nextProps.seriesOptions.join(" ") !== this.props.seriesOptions.join(" ")
            || nextProps.configurationOptions !== this.props.configurationOptions
            || nextProps.alertMessage !== this.props.alertMessage;
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    private unsubscribe() {
        if (this.subscriptionHandle) {
            mx.data.unsubscribe(this.subscriptionHandle);
        }
        this.clearRefreshInterval();
    }

    private onRefresh = () => {
        if (!this.props.fetchingData) {
            store.dispatch(this.props.fetchData(this.props));
        }
    }

    private handleOnClick = (options: Data.OnClickOptions<{ x: string, y: number }, Data.SeriesProps>) => {
        if (options.mxObject) {
            handleOnClick(options.options, options.mxObject, options.mxForm);
        } else if (options.trace) {
            this.createDataPoint(options.options, options.trace)
                .then(mxObject => handleOnClick(options.options, mxObject, options.mxForm))
                .catch(error => mx.ui.error(`An error occured while creating ${options.options.dataEntity} object: ${error}`));
        }
    }

    private handleOnHover = (options: Data.OnHoverOptions<{ x: string, y: number }, Data.SeriesProps>) => {
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

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        this.unsubscribe();
        if (mxObject) {
            this.subscriptionHandle = mx.data.subscribe({
                callback: () => store.dispatch(this.props.fetchData(this.props)),
                guid: mxObject.getGuid()
            });
        }
    }

    private clearRefreshInterval() {
        window.clearInterval(this.intervalID);
        this.intervalID = undefined;
    }
}

const mapStateToProps: MapStateToProps<BarChartInstanceState, BarChartContainerProps, ReduxStore> = (state, props) => {
    if (state.bar[props.friendlyId]) {
        return state.bar[props.friendlyId];
    }

    return defaultInstanceState as BarChartInstanceState;
};
const mapDispatchToProps: MapDispatchToProps<typeof BarChartContainerActions, BarChartContainerProps> =
    dispatch => bindActionCreators(BarChartContainerActions, dispatch);
export const ReduxContainer = connect(mapStateToProps, mapDispatchToProps)(BarChartDataHandler);
