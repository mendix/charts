import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";
import { ReactChild } from "react";
import { Action, Dispatch } from "redux";
import { seriesActionType } from "../../store/SeriesReducer";
import { ChartType, fetchThemeConfigs as fetchLineThemeConfig } from "../../utils/configs";
import { fetchByXPath, fetchData as fetchSeriesData, generateRESTURL, parseAdvancedOptions } from "../../utils/data";
import { Data } from "../../utils/namespaces";
import { LineChartDataHandlerProps } from "../components/LineChartDataHandler";
import { getData } from "../utils/data";
import { LineChartAction, scatterPrefix } from "./LineChartReducer";

const actionType = seriesActionType(scatterPrefix);
export const showAlertMessage = (instanceID: string, alertMessage: ReactChild): Partial<LineChartAction> =>
    ({ type: actionType.ALERT_MESSAGE, instanceID, alertMessage });
export const isFetching = (instanceID: string, fetchingData: boolean): Partial<LineChartAction> =>
    ({ type: actionType.TOGGLE_FETCHING_DATA, instanceID, fetchingData });
export const noContext = (instanceID: string): Partial<LineChartAction> =>
    ({ type: actionType.NO_CONTEXT, instanceID });

export const fetchData = (props: LineChartDataHandlerProps) => (dispatch: Dispatch<Partial<LineChartAction> & Action, any>) => {
    return () => {
        if (props.mxObject && props.series.length) {
            if (!props.fetchingData) {
                dispatch({
                    type: actionType.TOGGLE_FETCHING_DATA,
                    instanceID: props.instanceID,
                    fetchingData: true
                });
            }
            const mixinSeries: Data.LineSeriesProps[] = props.series.filter(series => series.seriesType === "static");
            const dynamicSeries = props.series.filter(series => series.seriesType === "dynamic");

            Promise.all(dynamicSeries.map(dynSeries => {
                const entity = dynSeries.seriesEntity.split("/")[1];
                const dynAttributes = [];
                if (dynSeries.seriesNameAttribute) {
                    dynAttributes.push(dynSeries.seriesNameAttribute);
                }
                if (dynSeries.colorAttribute) {
                    dynAttributes.push(dynSeries.colorAttribute);
                }
                if (dynSeries.fillColorAttribute) {
                    dynAttributes.push(dynSeries.fillColorAttribute);
                }

                return fetchByXPath({
                    entity,
                    guid: "",
                    constraint: "",
                    attributes: dynAttributes
                })
                .then(mxObjects => {
                    return mixinSeries.concat(mxObjects.map(mxSeries => {
                        const lineColor = dynSeries.colorAttribute ? mxSeries.get(dynSeries.colorAttribute) : "";
                        const fillColor = dynSeries.fillColorAttribute ? mxSeries.get(dynSeries.fillColorAttribute) : "";
                        const name = dynSeries.seriesNameAttribute ? mxSeries.get(dynSeries.seriesNameAttribute) : "";
                        const entityRef = dynSeries.seriesEntity.split("/")[0];
                        const entityConstraint = dynSeries.entityConstraint + `[${entityRef} = '${mxSeries.getGuid()}']`;

                        return {
                            ...dynSeries, // Mixin all fixed dynamic series props
                            entityConstraint,
                            fillColor,
                            lineColor,
                            name
                        } as Data.LineSeriesProps;
                    }));
                });
            })).then(mixedInSeries => {
                const workableSeries = mixedInSeries.length ? mixedInSeries[0] : props.series;
                Promise.all(workableSeries.map(series => {
                    const attributes = [ series.xValueAttribute, series.yValueAttribute ];
                    [ series.xValueSortAttribute, series.markerSizeAttribute ].forEach(attribute => {
                        if (attribute) {
                            attributes.push(attribute);
                        }
                    });
                    const mxObject = props.mxObject as mendix.lib.MxObject;
                    const url = series.restUrl && generateRESTURL(mxObject, series.restUrl, props.restParameters);

                    return fetchSeriesData<Data.SeriesProps>({
                        guid: mxObject.getGuid(),
                        entity: series.dataEntity,
                        constraint: series.entityConstraint,
                        sortAttribute: series.xValueSortAttribute || series.xValueAttribute,
                        sortOrder: series.sortOrder,
                        type: series.dataSourceType,
                        attributes,
                        microflow: series.dataSourceMicroflow,
                        url: url && `${url}&seriesName=${series.name}`,
                        customData: series
                    });
                }))
                .then(seriesData => seriesData.map(({ mxObjects, restData, customData }) => ({
                    data: mxObjects,
                    restData,
                    series: customData as Data.LineSeriesProps
                })))
                .then((data: Data.SeriesData<Data.LineSeriesProps>[]) => dispatch({
                    seriesData: data,
                    layoutOptions: props.layoutOptions || "{\n\n}",
                    scatterData: getData(data, props),
                    seriesOptions: data.map(({ series }) => series.seriesOptions || "{\n\n}"),
                    configurationOptions: props.configurationOptions || "{\n\n}",
                    instanceID: props.instanceID,
                    type: actionType.UPDATE_DATA_FROM_FETCH
                }))
                .catch(reason => {
                    window.mx.ui.error(reason);
                    dispatch({ type: actionType.FETCH_DATA_FAILED, instanceID: props.instanceID });
                });
            });
        } else {
            dispatch({ type: actionType.NO_CONTEXT, instanceID: props.instanceID });
        }
    };
};

export const fetchThemeConfigs = (instanceID: string, type: ChartType) => (dispatch: Dispatch<any, any>) => () => {
    dispatch({ type: actionType.FETCH_THEME_CONFIGS, instanceID });
    fetchLineThemeConfig(type)
        .then(themeConfigs => dispatch({ type: actionType.FETCH_THEME_CONFIGS_COMPLETE, instanceID, themeConfigs }));
};

export const loadPlayground = (instanceID: string) => (dispatch: Dispatch<any, any>) => async () => {
    const { SeriesPlayground } = await import("../../components/SeriesPlayground");
    dispatch({ type: actionType.LOAD_PLAYGROUND, instanceID, playground: SeriesPlayground });
};

export const updateDataFromPlayground = (instanceID: string, scatterData: ScatterData[], layoutOptions: string, seriesOptions: string[], configurationOptions: string): Partial<LineChartAction> => {
    let newScatterData = scatterData;
    if (seriesOptions && seriesOptions.length) {
        newScatterData = scatterData.map((data, index) => {
            const parsedOptions = parseAdvancedOptions("developer", seriesOptions[index]);

            // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
            return { ...deepMerge.all<ScatterData>([ data, parsedOptions ]), customdata: data.customdata };
        });
    }

    return ({
        type: actionType.UPDATE_DATA_FROM_PLAYGROUND,
        instanceID,
        scatterData: newScatterData,
        layoutOptions,
        seriesOptions,
        configurationOptions
    });
};
export const toggleUpdatingData = (instanceID: string, updatingData: boolean): Partial<LineChartAction> =>
    ({ type: actionType.TOGGLE_UPDATING_DATA, instanceID, updatingData });
