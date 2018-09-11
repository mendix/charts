import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";
import { ReactChild } from "react";
import { Action, Dispatch } from "redux";
import { seriesActionType } from "../../store/SeriesReducer";
import { ChartType, fetchThemeConfigs as fetchLineThemeConfig } from "../../utils/configs";
import { fetchByXPathGuids, fetchData as fetchSeriesData, generateRESTURL, parseAdvancedOptions } from "../../utils/data";
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

            Promise.all(props.series.map(series => {
                const attributes = [ series.xValueAttribute, series.yValueAttribute, series.xValueSortAttribute, series.markerSizeAttribute ]
                    .reduce((cummulator: string[], attribute) => {
                        if (attribute && series.seriesType === "static") {
                            cummulator.push(attribute);
                        }

                        return cummulator;
                    }, []);

                const { mxObject } = props;
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
                    url: (url && series.seriesType === "static") ? `${url}&seriesName=${series.name}` : url,
                    customData: series
                });
            }))
                .then(seriesData => {
                    return seriesData.reduce(async (cummulator: Promise<Data.SeriesData<Data.LineSeriesProps>[]>, { mxObjects, restData, customData }) => {
                        if (restData && customData && customData.seriesType === "dynamic" && customData.dataSourceType === "REST") {
                            const returnData = await cummulator;
                            const { seriesEntity, seriesNameAttribute, colorAttribute, fillColorAttribute } = customData;
                            const association = (seriesEntity.indexOf("/") > -1)
                                ? seriesEntity.split("/")[0].split(".")[1]
                                : seriesEntity.split(".")[1];
                            restData.forEach(restDataSeries => {
                                const fillColor = fillColorAttribute ? restDataSeries[fillColorAttribute] : undefined;
                                const lineColor = colorAttribute ? restDataSeries[colorAttribute] : undefined;
                                const name = seriesNameAttribute ? restDataSeries[seriesNameAttribute] : undefined;
                                returnData.push({
                                    data: mxObjects,
                                    restData: restDataSeries[association],
                                    series: {
                                        ...customData,
                                        lineColor,
                                        name,
                                        fillColor
                                    }
                                } as Data.SeriesData<Data.LineSeriesProps>);
                            });

                            return returnData;
                        } else if (mxObjects && customData && customData.seriesType === "dynamic" && (customData.dataSourceType === "microflow" || customData.dataSourceType === "XPath")) {
                            const isPersistable = mxObjects[0].isPersistable();
                            const returnData = await cummulator;
                            const { seriesEntity, colorAttribute, seriesNameAttribute, fillColorAttribute } = customData;
                            const association = (seriesEntity.indexOf("/") > -1 && mxObjects[0].isPersistable())
                                ? seriesEntity.split("/")[0]
                                : seriesNameAttribute;

                            const seriesItems: { [key: string]: (mendix.lib.MxObject | number)[] } = {};
                            for (const item of mxObjects) {
                                const referenceGuid = item.get(association) as string;
                                if (!seriesItems[referenceGuid]) {
                                    seriesItems[referenceGuid] = [];
                                }
                                seriesItems[referenceGuid].push(item);
                            }
                            if (isPersistable) {
                                const associatedMxObjects = await fetchByXPathGuids(Object.keys(seriesItems));
                                associatedMxObjects.forEach(associated => {
                                    const name = seriesNameAttribute ? associated.get(seriesNameAttribute) : undefined;
                                    const fillColor = fillColorAttribute ? associated.get(fillColorAttribute) : undefined;
                                    const lineColor = colorAttribute ? associated.get(colorAttribute) : undefined;
                                    returnData.push({
                                        data: seriesItems[associated.getGuid()],
                                        series: {
                                            ...customData,
                                            lineColor,
                                            name,
                                            fillColor
                                        }
                                    } as Data.SeriesData<Data.LineSeriesProps>);
                                });
                            } else {
                                Object.keys(seriesItems).forEach(name => {
                                const fillColor = fillColorAttribute ? (seriesItems[name][0] as mendix.lib.MxObject).get(fillColorAttribute) : undefined;
                                const lineColor = colorAttribute ? (seriesItems[name][0] as mendix.lib.MxObject).get(colorAttribute) : undefined;
                                returnData.push({
                                    data: seriesItems[name],
                                    series: {
                                        ...customData,
                                        lineColor,
                                        name,
                                        fillColor
                                    }
                                } as Data.SeriesData<Data.LineSeriesProps>);
                            });
                            }

                            return returnData;
                        } else {
                            const returnData = await cummulator;
                            returnData.push({
                                data: mxObjects,
                                restData,
                                series: customData as Data.LineSeriesProps
                            });

                            return returnData;
                        }

                    }, Promise.resolve([])) as Promise<Data.SeriesData<Data.LineSeriesProps>[]>;
                })
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
