import { ReactChild, createElement } from "react";
import deepMerge from "deepmerge";
import { Datum } from "plotly.js";
import { Container, Data } from "./namespaces";
import SeriesProps = Data.SeriesProps;
import SeriesData = Data.SeriesData;
import EventProps = Data.EventProps;
import ScatterTrace = Data.ScatterTrace;
import ReferencesSpec = Data.ReferencesSpec;
import FetchedData = Data.FetchedData;
import FetchDataOptions = Data.FetchDataOptions;
import FetchByXPathOptions = Data.FetchByXPathOptions;

type MxO = mendix.lib.MxObject;

export const validateSeriesProps = <T extends Partial<SeriesProps>>(dataSeries: T[], widgetId: string, layoutOptions: string): ReactChild => { // tslint:disable-line max-line-length
    if (dataSeries && dataSeries.length) {
        const errorMessage: string[] = [];
        dataSeries.forEach(series => {
            const identifier = series.name ? `series "${series.name}"` : "the widget";
            if (series.dataSourceType === "microflow") {
                if (!series.dataSourceMicroflow) {
                    errorMessage.push(`'Data source type' in ${identifier} is set to 'Microflow' but no microflow is specified.`); // tslint:disable-line max-line-length
                }
                if (series.xValueAttribute && series.xValueAttribute.split("/").length > 1) {
                    errorMessage.push(`'X-axis data attribute' in ${identifier} does not support references for data source 'Microflow'`);
                }
                if (series.xValueSortAttribute && series.xValueSortAttribute.split("/").length > 1) {
                    errorMessage.push(`'X-axis sort attribute' in ${identifier} does not support references for data source 'Microflow'`);
                }
            } else if (series.dataSourceType === "XPath") {
                if (series.xValueAttribute && series.xValueAttribute.split("/").length > 3) {
                    errorMessage.push(`'X-axis data attribute' in ${identifier} supports maximal one level deep reference`);
                }
                if (series.xValueSortAttribute && series.xValueSortAttribute.split("/").length > 3) {
                    errorMessage.push(`'X-axis sort attribute' in ${identifier} supports maximal one level deep reference`);
                }
            } else if (series.dataSourceType === "REST") {
                if (!series.restUrl) {
                    errorMessage.push(`\n'Data source type' in ${identifier} is set to 'REST' but no REST URL is specified.`);
                }
            }
            if (series.seriesOptions && series.seriesOptions.trim()) {
                const error = validateAdvancedOptions(series.seriesOptions.trim());
                if (error) {
                    errorMessage.push(`Invalid options JSON for ${identifier}: ${error}`);
                }
            }
            if (series.dataEntity && window.mx) {
                const dataEntityMeta = window.mx.meta.getEntity(series.dataEntity);
                if (series.dataSourceType === "XPath" && !dataEntityMeta.isPersistable()) {
                    errorMessage.push(`Entity ${series.dataEntity} should be persistable when using Data source 'Database'`);
                }
            }
        });
        if (layoutOptions && layoutOptions.trim()) {
            const error = validateAdvancedOptions(layoutOptions.trim());
            if (error) {
                errorMessage.push(`Invalid layout JSON: ${error}`);
            }
        }
        if (errorMessage.length) {
            return createElement("div", {},
                `Configuration error in widget ${widgetId}:`,
                errorMessage.map((message, key) => createElement("p", { key }, message))
            );
        }
    }

    return "";
};

export const validateAdvancedOptions = (rawData: string): string => {
    if (rawData && rawData.trim()) {
        try {
            JSON.parse(rawData.trim());
        } catch (error) {
            return error.message;
        }
    }

    return "";
};

export const fetchData = <S>(options: FetchDataOptions<S>): Promise<FetchedData<S>> =>
    new Promise<FetchedData<S>>((resolve, reject) => {
        const { guid, entity, sortAttribute, sortOrder, attributes, customData } = options;
        if (entity && guid) {
            if (options.type === "XPath") {
                const references = getReferences(options.attributes || []);
                fetchByXPath({
                    guid,
                    entity,
                    constraint: options.constraint || "",
                    sortAttribute,
                    sortOrder,
                    attributes: references.attributes,
                    references: references.references
                })
                .then(mxObjects => resolve({ mxObjects, customData }))
                .catch(message => reject({ message, customData: options.customData }));
            } else if (options.type === "microflow" && options.microflow) {
                fetchByMicroflow(options.microflow, guid)
                    .then(mxObjects => resolve({ mxObjects, customData }))
                    .catch(message => reject({ message, customData: options.customData }));
            } else if (options.type === "REST" && options.url && attributes) {
                fetchByREST(options.url)
                    .then(restData => {
                        const validationString = validateJSONData(restData, attributes);
                        if (validationString) {
                            reject({ message: validationString, customData: options.customData });
                        } else {
                            resolve({ restData, customData });
                        }
                    })
                    .catch(reject);
            }
        } else {
            reject("entity & guid are required");
        }
    });

export const fetchSeriesData = <S extends SeriesProps = SeriesProps>(mxObject: MxO, series: S, restParameters: Container.RestParameter[] = []): Promise<SeriesData<S>> =>
    new Promise<SeriesData<S>>((resolve, reject) => {
        if (series.dataEntity) {
            if (series.dataSourceType === "XPath") {
                const attributes = [ series.xValueAttribute, series.yValueAttribute, series.xValueSortAttribute ];
                if (series.markerSizeAttribute) {
                    attributes.push(series.markerSizeAttribute);
                }

                const references = getReferences(attributes);
                const sortAttribute = series.xValueSortAttribute || series.xValueAttribute;
                fetchByXPath({
                    guid: mxObject.getGuid(),
                    entity: series.dataEntity,
                    constraint: series.entityConstraint,
                    sortAttribute,
                    sortOrder: series.sortOrder,
                    attributes: references.attributes,
                    references: references.references
                }).then(mxObjects => resolve({ data: mxObjects, series })).catch(reject);
            } else if (series.dataSourceType === "microflow" && series.dataSourceMicroflow) {
                fetchByMicroflow(series.dataSourceMicroflow, mxObject.getGuid())
                    .then(mxObjects => resolve({ data: mxObjects, series }))
                    .catch(reject);
            } else if (series.dataSourceType === "REST" && series.restUrl) {
                const parameters: string[] = [ `contextId=${mxObject.getGuid()}`, `seriesName=${series.name}` ];
                parameters.push(...restParameters.map(parameter =>
                    `${parameter.parameterAttribute}=${mxObject.get(parameter.parameterAttribute)}`)
                );
                const url = `${series.restUrl}${(series.restUrl.indexOf("?") >= 0 ? "&" : "?")}${parameters.join("&")}`;
                fetchByREST(url)
                    .then(restData => {
                        const attributes: string[] = [ series.xValueAttribute, series.yValueAttribute ];
                        const validationString = validateJSONData(restData, attributes);
                        if (validationString) {
                            reject(validationString);
                        } else {
                            resolve({ restData, series });
                        }
                    })
                    .catch(reject);
            }
        } else {
            resolve();
        }
    });

export const generateRESTURL = (mxObject: MxO, endpoint: string, parameters: Container.RestParameter[]) => {
    const parameterString = [ `contextId=${mxObject.getGuid()}` ].concat(parameters.map(parameter =>
        `${parameter.parameterAttribute}=${mxObject.get(parameter.parameterAttribute)}`
    )).join("&");

    return `${endpoint}${(endpoint.indexOf("?") >= 0 ? "&" : "?")}${parameterString}`;
};

const validateJSONData = (data: any, attributes: string[]): string => {
    for (const attribute of attributes) {
        if (data.length > 1 && !data[0].hasOwnProperty(attribute) && attribute) {
            return `JSON result for REST data source does not contain attribute ${attribute}`;
        }
    }

    return "";
};

const getReferences = (attributePaths: string[]): ReferencesSpec => {
    let references: ReferencesSpec = { attributes: [] };
    attributePaths.forEach(attribute => {
        references = addPathReference(references, attribute);
    });

    return references;
};

const addPathReference = (references: ReferencesSpec, path: string): ReferencesSpec =>
    path.split("/").reduce((referenceSet, part, index, pathParts) => {
        let parent = referenceSet;
        // Use relations, skip entities sample: "module.relation_X_Y/module.entity_Y/attribute"
        // At the moment Mendix support only 1 level deep.
        if (index % 2 === 0) {
            for (let i = 0; i < index; i += 2) {
                if (parent.references) {
                    parent = parent.references[pathParts[i]];
                }
            }
            if (pathParts.length - 1 === index) {
                // Skip empty attributes
                if (part) {
                    parent.attributes = parent.attributes ? parent.attributes.concat(part) : [ part ];
                }
            } else if (!parent.references) {
                parent.references = { [part]: {} };
            } else if (!parent.references[part]) {
                parent.references[part] = {};
            }
        }

        return referenceSet;
    }, references);

export const fetchByXPath = (options: FetchByXPathOptions): Promise<MxO[]> => new Promise<MxO[]>((resolve, reject) => {
    const { guid, entity, constraint, sortAttribute, sortOrder, attributes, references } = options;
    const entityPath = entity.split("/");
    const entityName = entityPath.length > 1 ? entityPath[entityPath.length - 1] : entity;
    const xpath = "//" + entityName + constraint.split("[%CurrentObject%]").join(guid);

    window.mx.data.get({
        callback: resolve,
        error: error => reject(`An error occurred while retrieving data via XPath (${xpath}): ${error.message}`),
        filter: {
            sort: sortAttribute && sortAttribute.indexOf("/") === -1 ? [ [ sortAttribute, sortOrder || "asc" ] ] : [],
            references,
            attributes
        },
        xpath
    });
});

export const fetchByMicroflow = (actionname: string, guid: string): Promise<MxO[]> =>
    new Promise((resolve, reject) => {
        const errorMessage = `An error occurred while retrieving data by microflow (${actionname}): `;
        window.mx.ui.action(actionname, {
            callback: (mxObjects: MxO[]) => resolve(mxObjects),
            error: error => reject(`${errorMessage} ${error.message}`),
            params: { applyto: "selection", guids: [ guid ] }
        });
    });

export const fetchByREST = (url: string): Promise<any> => new Promise((resolve, reject) => {
    const errorMessage = `An error occurred while retrieving data via REST endpoint (${url}): `;
    window.fetch(url, {
        credentials: "include",
        headers: { "X-Csrf-Token" : mx.session.getConfig("csrftoken") }
    }).then((data) => {
        if (data.ok) {
            resolve(data.json());
        } else {
            reject(`${errorMessage} ${data.statusText}`);
        }
    }).catch(error => reject(`${errorMessage} ${error.message}`));
});

export const handleOnClick = <T extends EventProps>(options: T, mxObject?: MxO, mxform?: mxui.lib.form._FormBase) => {
    const context = new mendix.lib.MxContext();

    if (!mxObject || options.onClickEvent === "doNothing") {
        return;
    } else {
        context.setContext(mxObject.getEntity(), mxObject.getGuid());
    }

    if (options.onClickEvent === "callMicroflow" && options.onClickMicroflow) {
        window.mx.ui.action(options.onClickMicroflow, {
            error: error => window.mx.ui.error(`Error while executing microflow ${options.onClickMicroflow}: ${error.message}`), // tslint:disable-line max-line-length
            params: {
                applyto: "selection",
                guids: [ mxObject.getGuid() ]
            },
            origin: mxform
        });
    } else if (options.onClickEvent === "showPage" && options.onClickPage) {
        window.mx.ui.openForm(options.onClickPage, {
            context,
            error: error => window.mx.ui.error(`Error while opening page ${options.onClickPage}: ${error.message}`),
            location: options.openPageLocaton
        });
    } else if (options.onClickEvent === "callNanoflow" && options.onClickNanoflow.nanoflow && mxform && context) {
        window.mx.data.callNanoflow({
            context,
            error: error => mx.ui.error(`Error executing the on click nanoflow ${error.message}`),
            nanoflow: options.onClickNanoflow,
            origin: mxform
        });
    }
};

export const openTooltipForm = (domNode: HTMLDivElement, tooltipForm: string, dataObject: mendix.lib.MxObject) => {
    const context = new mendix.lib.MxContext();
    context.setContext(dataObject.getEntity(), dataObject.getGuid());
    window.mx.ui.openForm(tooltipForm, { domNode, context, location: "node" });
};

export const getSeriesTraces = ({ data, restData, series }: SeriesData): ScatterTrace => {
    let xData: Datum[] = [];
    let yData: number[] = [];
    let markerSizeData: number[] | undefined = [];
    let sortData: Datum[] = [];
    if (data) {
        xData = data.map(mxObject => getAttributeValue(mxObject, series.xValueAttribute));
        yData = data.map(mxObject => parseFloat(mxObject.get(series.yValueAttribute) as string));
        markerSizeData = series.markerSizeAttribute
            ? data.map(mxObject => parseFloat(mxObject.get(series.markerSizeAttribute as string) as string))
            : undefined;
        sortData = series.xValueSortAttribute
            ? data.map(mxObject => getAttributeValue(mxObject, series.xValueSortAttribute))
            : [];
    } else if (restData) {
        xData = restData.map((dataValue: any) => dataValue[series.xValueAttribute]);
        yData = restData.map((dataValue: any) => dataValue[series.yValueAttribute]);
        markerSizeData = series.markerSizeAttribute
            ? restData.map((dataValue: any) => dataValue[series.markerSizeAttribute as string])
            : undefined;
        sortData = series.xValueSortAttribute
            ? restData.map((dataValue: any) => dataValue[series.xValueSortAttribute])
            : [];
    }
    const sortDataError = xData.length !== yData.length || xData.length !== sortData.length;
    const alreadySorted = series.dataSourceType === "XPath" && series.xValueSortAttribute && series.xValueSortAttribute.split("/").length === 1;
    if (!series.xValueSortAttribute || alreadySorted || sortDataError) {
        return {
            x: xData,
            y: yData,
            marker: markerSizeData ? { size: markerSizeData } : {}
        };
    }
    const unsorted = sortData.map((value, index) => {
        return {
            x: xData[index],
            y: yData[index],
            marker: markerSizeData ? { size: markerSizeData[index] } : {},
            sort: value
        };
    });
    const sorted = unsorted.sort((a, b) => {
        if (series.sortOrder === "asc") {
            if (a.sort < b.sort) {
                return -1;
            }
            if (a.sort > b.sort) {
                return 1;
            }
        }
        // Sort order "desc"
        if (a.sort > b.sort) {
            return -1;
        }
        if (a.sort < b.sort) {
            return 1;
        }
        return 0;
    });
    const sortedXData = sorted.map(value => value.x);
    const sortedYData = sorted.map(value => value.y);
    const sortedSizeData = markerSizeData && sorted.map(value => value.marker.size);

    return {
        x: sortedXData,
        y: sortedYData,
        marker: { size: sortedSizeData as number[] }
    };
};

export const getRuntimeTraces = ({ data, series }: SeriesData): ({ name: string } & ScatterTrace) =>
    ({ name: series.name, ...getSeriesTraces({ data, series }) });

export const getAttributeValue = (mxObject: MxO, attribute: string): Datum => {
    let valueObject = mxObject;
    const path = attribute.split("/");
    const attributeName = path[path.length - 1];
    // Use relations only, skip entity and attribute sample: "module.relation_X_Y/module.entity_Y/attribute"
    for (let i = 0; i < path.length - 1; i += 2) {
        // Know issue; Mendix will return max 1 level deep
        valueObject = valueObject.getChildren(path[i])[0];
        if (!valueObject) {
            return "";
        }
    }
    if (valueObject.isDate(attributeName)) {
        const timestamp = valueObject.get(attributeName) as number;
        const date = new Date(timestamp);

        return `${parseDate(date)} ${parseTime(date)}`;
    }
    if (valueObject.isEnum(attributeName)) {
        const enumValue = valueObject.get(attributeName) as string;

        return valueObject.getEnumCaption(attributeName, enumValue);
    }
    if (valueObject.isNumeric(attributeName)) {
        return parseFloat(valueObject.get(attributeName) as any);
    }
    const value = valueObject.get(attributeName) as string;

    return value !== null ? value : "";
};

export const parseDate = (date: Date): string => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

export const parseTime = (date: Date): string => {
    const time: string[] = [];
    time.push(date.getHours() < 10 ? `0${date.getHours()}` : `${date.getHours()}`);
    time.push(date.getMinutes() < 10 ? `0${date.getMinutes()}` : `${date.getMinutes()}`);
    time.push(date.getSeconds() < 10 ? `0${date.getSeconds()}` : `${date.getSeconds()}`);

    return time.join(":");
};

/**
 * Returns a random integer between min (included) and max (included)
 * @param count
 * @param rangeMax
 * @param rangeMin
 */
export const getRandomNumbers = (count: number, rangeMax: number, rangeMin = 0): number[] => {
    const numbers: number[] = [];
    for (let i = 0; i < count; i++) {
        numbers.push(Math.round(Math.random() * (rangeMax - rangeMin + 1) + rangeMin));
    }

    return numbers;
};

const emptyTarget = (value: any) => Array.isArray(value) ? [] : {};

const clone = (value: any, options: any) => deepMerge(emptyTarget(value), value, options);

export const arrayMerge = (target: any[], source: any[], options: any) => {
    const destination = target.slice();

    source.forEach((e, i) => {
        if (typeof destination[i] === "undefined") {
            const cloneRequested = options.clone !== false;
            const shouldClone = cloneRequested && options.isMergeableObject(e);
            destination[i] = shouldClone ? clone(e, options) : e;
        } else if (options.isMergeableObject(e)) {
            destination[i] = deepMerge(target[i], e, options);
        } else if (target.indexOf(e) === -1) {
            destination.push(e);
        }
    });

    return destination;
};
