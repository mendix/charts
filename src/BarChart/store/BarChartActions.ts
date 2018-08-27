import deepMerge from "deepmerge";
import { ScatterData } from "plotly.js";
import { ReactChild } from "react";
import { Action, Dispatch } from "redux";
import { seriesActionType } from "../../store/SeriesReducer";
import { fetchThemeConfigs as fetchBarThemeConfig } from "../../utils/configs";
import { fetchByXPath, fetchByXPathGuids, fetchData as fetchSeriesData, generateRESTURL, parseAdvancedOptions } from "../../utils/data";
import { Data } from "../../utils/namespaces";
import { BarChartDataHandlerProps } from "../components/BarChartDataHandler";
import { getData } from "../utils/data";
import { BarChartAction, barPrefix } from "./BarChartReducer";

const actionType = seriesActionType(barPrefix);
export const showAlertMessage = (instanceID: string, alertMessage: ReactChild): Partial<BarChartAction> =>
    ({ type: actionType.ALERT_MESSAGE, instanceID, alertMessage });
export const isFetching = (instanceID: string, fetchingData: boolean): Partial<BarChartAction> =>
    ({ type: actionType.TOGGLE_FETCHING_DATA, instanceID, fetchingData });
export const noContext = (instanceID: string): Partial<BarChartAction> => ({ type: actionType.NO_CONTEXT, instanceID });

export const fetchData = (props: BarChartDataHandlerProps) => (dispatch: Dispatch<Partial<BarChartAction> & Action, any>) => {
    return () => {
        if (props.mxObject && props.series.length) {
            if (!props.fetchingData) {
                dispatch({ type: actionType.TOGGLE_FETCHING_DATA, instanceID: props.instanceID, fetchingData: true });
            }
            const mixinSeries: Data.SeriesProps[] = props.series.filter(series => series.seriesType === "static");
            const dynamicSeries = props.series.filter(series => series.seriesType === "dynamic" && series.dataSourceType === "XPath");

            Promise.all(dynamicSeries.map(dynSeries => {
                const entityPath = dynSeries.seriesEntity.split("/");
                const entity = entityPath.pop() as string;
                const constraint = "";
                const dynAttributes = [ dynSeries.seriesNameAttribute, dynSeries.colorAttribute ];

                return fetchByXPath({
                    entity,
                    guid: "",
                    constraint,
                    attributes: dynAttributes
                })
                .then(mxObjects => mixinSeries.concat(mxObjects.map(mxSeries => {
                        const barColor = mxSeries.get(dynSeries.colorAttribute) || "";
                        const name = mxSeries.get(dynSeries.seriesNameAttribute) || "";
                        const entityRef = dynSeries.seriesEntity.split("/")[0];
                        const entityConstraint = dynSeries.entityConstraint + `[${entityRef} = '${mxSeries.getGuid()}']`;

                        return {
                            ...dynSeries,
                            entityConstraint,
                            barColor,
                            name
                        } as Data.SeriesProps;
                    }))
                );
            })).then(mixedInSeries => {
                const workableSeries = mixedInSeries.length ? mixedInSeries[0] : props.series;
                Promise.all(workableSeries.map(series => {
                    const attributes = [ series.xValueAttribute, series.yValueAttribute ];
                    if (series.xValueSortAttribute) {
                        attributes.push(series.xValueSortAttribute);
                    }
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
                        url: (url && series.seriesType === "static") ? `${url}&seriesName=${series.name}` : url ,
                        customData: series
                    });
                }))
                .then(seriesData => {
                    return seriesData.reduce(async (cummulator: Promise<Data.SeriesData<Data.SeriesProps>[]>, { mxObjects, restData, customData }) => {
                        const returnData = await cummulator;
                        if (restData && customData && customData.seriesType === "dynamic" && customData.dataSourceType === "REST") {
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
                                } as Data.SeriesData<Data.SeriesProps>);
                            });
                        } else if (mxObjects && customData && customData.seriesType === "dynamic" && customData.dataSourceType === "microflow") {
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
                            // if (mxObjects[0].isPersistable() && mxObjects[0].isReference(association)) {

                            // }
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
                        // } else if(mxObjects && customData && customData.seriesType === "dynamic" && customData.dataSourceType === "microflow") {
                        //     // sort mxObjects by lineColor.
                        //     // get distinct for lineColors from the passed objects.
                        //     returnData.push({
                        //         data: mxObjects,
                        //         restData,
                        //         series: { ...customData, lineColor, name}
                        //     });
                        // } else (mxObjects && customData && customData.seriesType === "dynamic" && customData.dataSourceType === "XPath") {
                        //     // remember you are meant to return to referenced child mx object or attribute via https://apidocs.mendix.com/7/client/mendix_lib_MxObject.html#getChildren
                        //     // https://apidocs.mendix.com/7/client/mx.data.html (static) get
                        // }
                            returnData.push({
                                data: mxObjects,
                                restData,
                                series: customData as Data.SeriesProps
                            });
                        }

                        return returnData;
                    }, Promise.resolve([])) as Promise<Data.SeriesData<Data.SeriesProps>[]>;
                })
                .then((data: Data.SeriesData<Data.SeriesProps>[]) => dispatch({
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

export const fetchThemeConfigs = (instanceID: string, orientation: "bar" | "column") => (dispatch: Dispatch<any, any>) => () => {
    dispatch({ type: actionType.FETCH_THEME_CONFIGS, instanceID });
    fetchBarThemeConfig(orientation === "bar" ? "BarChart" : "ColumnChart")
        .then(themeConfigs => dispatch({ type: actionType.FETCH_THEME_CONFIGS_COMPLETE, instanceID, themeConfigs }));
};

export const loadPlayground = (instanceID: string) => (dispatch: Dispatch<any, any>) => async () => {
    const { SeriesPlayground } = await import("../../components/SeriesPlayground");
    dispatch({ type: actionType.LOAD_PLAYGROUND, instanceID, playground: SeriesPlayground });
};

export const updateDataFromPlayground = (instanceID: string, scatterData: ScatterData[], layoutOptions: string, seriesOptions: string[], configurationOptions: string): Partial<BarChartAction> => {
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
export const toggleUpdatingData = (instanceID: string, updatingData: boolean): Partial<BarChartAction> =>
    ({ type: actionType.TOGGLE_UPDATING_DATA, instanceID, updatingData });
