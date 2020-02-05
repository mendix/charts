import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";
import { ReactChild } from "react";
import { Action, Dispatch } from "redux";
import { seriesActionType } from "../../store/SeriesReducer";
import { ChartType, fetchThemeConfigs as fetchLineThemeConfig } from "../../utils/configs";
import { fetchByGuids, fetchData as fetchSeriesData, generateRESTURL, parseAdvancedOptions } from "../../utils/data";
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
                            const { seriesEntity, seriesNameAttribute, colorAttribute, fillColorAttribute, seriesSortAttribute, seriesSortOrder } = customData;
                            const association = seriesEntity.indexOf("/") > -1
                                ? seriesEntity.split("/")[0].split(".")[1]
                                : seriesEntity.split(".")[1];

                            if (seriesSortAttribute) { // sorting
                                restData.sort((seriesA, seriesB) => {
                                    const seriesSortA = seriesA[seriesSortAttribute] as string;
                                    const seriesSortB = seriesB[seriesSortAttribute] as string;

                                    return seriesSortOrder === "asc" ? seriesSortA.localeCompare(seriesSortB) : seriesSortB.localeCompare(seriesSortA);
                                });
                            }

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
                            const returnData = await cummulator;
                            const { seriesEntity, colorAttribute, seriesNameAttribute, fillColorAttribute, seriesSortAttribute, seriesSortOrder } = customData;
                            const association = seriesEntity.indexOf("/") > -1
                                ? seriesEntity.split("/")[0]
                                : seriesNameAttribute;

                            const seriesItems: { [key: string]: mendix.lib.MxObject[] } = {};
                            const getAttributeValue = (mxObject: mendix.lib.MxObject, attribute: string, defaultValue?: string | boolean | number) => attribute
                                ? mxObject.isEnum(attribute)
                                    ? mxObject.getEnumCaption(attribute, mxObject.get(attribute) as string)
                                    : mxObject.get(attribute)
                                : defaultValue;

                            for (const item of mxObjects) {
                                const identifier = item.get(association) as string;
                                if (!seriesItems[identifier]) {
                                    seriesItems[identifier] = [];
                                }
                                seriesItems[identifier].push(item);
                            }
                            if (seriesEntity.indexOf("/") > -1) {
                                const guids = Object.keys(seriesItems);
                                const associatedMxObjects = await fetchByGuids({
                                    guids,
                                    sortAttribute: seriesSortAttribute,
                                    sortOrder: seriesSortOrder
                                });
                                associatedMxObjects.forEach(associated => {
                                    const name = getAttributeValue(associated, seriesNameAttribute, "");
                                    const fillColor = getAttributeValue(associated, fillColorAttribute);
                                    const lineColor = getAttributeValue(associated, colorAttribute);

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
                                const seriesNames = Object.keys(seriesItems);
                                if (seriesSortAttribute) { // sorting
                                    seriesNames.sort((seriesNameA, seriesNameB) => {
                                        const seriesSortA = seriesItems[seriesNameA][0].get(seriesSortAttribute) as string;
                                        const seriesSortB = seriesItems[seriesNameB][0].get(seriesSortAttribute) as string;

                                        return seriesSortOrder === "asc" ? seriesSortA.localeCompare(seriesSortB) : seriesSortB.localeCompare(seriesSortA);
                                    });
                                }

                                seriesNames.forEach(name => {
                                    const firstMxObject = seriesItems[name][0];
                                    const fillColor = getAttributeValue(firstMxObject, fillColorAttribute);
                                    const lineColor = getAttributeValue(firstMxObject, colorAttribute);
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

            // Temporary remove custom data, as it contains mx objects with circular reference.
            const customdata = data.customdata;
            delete data.customdata;

            // deepmerge doesn't go into the prototype chain, so it can't be used for copying mxObjects
            return { ...deepMerge.all<ScatterData>([ data, parsedOptions ]), customdata };
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

export const clearInstanceState = (instanceID: string) =>
    ({ type: actionType.CLEAR_INSTANCE_STATE, instanceID });
