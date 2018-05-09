import { Component, createElement } from "react";
import { connect } from "react-redux";
import { Dispatch, bindActionCreators } from "redux";
import { handleOnClick, isContextChanged, openTooltipForm, setRefreshAction, validateSeriesProps } from "../../utils/data";
import { Container, Data } from "../../utils/namespaces";
import { getDimensions, parseStyle } from "../../utils/style";
import * as BarChartContainerActions from "../store/BarChartActions";
import { BarChartReducerState } from "../store/BarChartReducer";
import { store } from "../store/store";
import { BarChart } from "./BarChart";

import BarChartContainerProps = Container.BarChartContainerProps;

export type BarChartDataHandlerProps = BarChartContainerProps & BarChartReducerState & typeof BarChartContainerActions;

export class BarChartDataHandler extends Component<BarChartDataHandlerProps> {
    private subscriptionHandle?: number;
    private intervalID?: number;

    render() {
        return createElement("div",
            {
                style: this.props.loading ? { ...getDimensions(this.props), ...parseStyle(this.props.style) } : undefined
            },
            createElement(BarChart, {
                ...this.props as BarChartDataHandlerProps,
                onClick: this.handleOnClick,
                onHover: this.handleOnHover,
                scatterData: this.props.scatterData,
                series: this.props.data ? this.props.data.map(({ series }) => series) : this.props.series
            })
        );
    }

    componentDidMount() {
        const validationError = validateSeriesProps(this.props.series, this.props.friendlyId, this.props.layoutOptions);
        if (validationError) {
            this.props.showAlertMessage(validationError);
        } else if (this.props.alertMessage) {
            this.props.showAlertMessage("");
        }
        if (this.props.devMode !== "basic") {
            store.dispatch(this.props.fetchThemeConfigs(this.props.orientation));
        }
    }

    componentWillReceiveProps(newProps: BarChartDataHandlerProps) {
        this.resetSubscriptions(newProps.mxObject);
        if (!newProps.alertMessage) {
            if (!this.props.fetchingConfigs && isContextChanged(this.props.mxObject, newProps.mxObject)) {
                store.dispatch(this.props.fetchData(newProps));
                this.clearRefreshInterval();
                this.intervalID = setRefreshAction(newProps.refreshInterval, newProps.mxObject)(this.onRefresh);
            }
        } else {
            // TODO:determine if this is OK
            this.clearRefreshInterval();
        }
    }

    shouldComponentUpdate(nextProps: BarChartDataHandlerProps) {
        return nextProps.loading !== this.props.loading
            || nextProps.playground !== this.props.playground
            || nextProps.layoutOptions !== this.props.layoutOptions
            || nextProps.seriesOptions.join(" ") !== this.props.seriesOptions.join(" ")
            || nextProps.configurationOptions !== this.props.configurationOptions;
    }

    componentWillUnmount() {
        if (this.subscriptionHandle) {
            mx.data.unsubscribe(this.subscriptionHandle);
        }
        this.clearRefreshInterval();
    }

    private onRefresh = () => {
        if (!this.props.loading) {
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
        this.componentWillUnmount();
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

const mapStateToProps = (state: BarChartReducerState) => state;
// TODO: Add more specific typings i.e BarChartContainerActions
const mapDispatchToProps = (dispatch: Dispatch<any, any>) => bindActionCreators(BarChartContainerActions, dispatch);

export const ReduxContainer = connect<BarChartReducerState, typeof BarChartContainerActions>(mapStateToProps, mapDispatchToProps)(BarChartDataHandler as any);
