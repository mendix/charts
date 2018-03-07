import { ReactChild, createElement } from "react";
import { Datum } from "plotly.js";
import { Data } from "./namespaces";
import SeriesProps = Data.SeriesProps;
import SeriesData = Data.SeriesData;
import SortOrder = Data.SortOrder;
import EventProps = Data.EventProps;
import ScatterTrace = Data.ScatterTrace;
import ReferencesSpec = Data.ReferencesSpec;

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
            } else {
                if (series.xValueAttribute && series.xValueAttribute.split("/").length > 3) {
                    errorMessage.push(`'X-axis data attribute' in ${identifier} supports maximal one level deep reference`);
                }
                if (series.xValueSortAttribute && series.xValueSortAttribute.split("/").length > 3) {
                    errorMessage.push(`'X-axis sort attribute' in ${identifier} supports maximal one level deep reference`);
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

export const fetchSeriesData = <S extends SeriesProps = SeriesProps>(mxObject: mendix.lib.MxObject, series: S): Promise<SeriesData<S>> =>
    new Promise<SeriesData<S>>((resolve, reject) => {
        if (series.dataEntity) {
            if (series.dataSourceType === "XPath") {
                const references = getReferences(series);
                const sortAttribute = series.xValueSortAttribute || series.xValueAttribute;
                fetchByXPath(mxObject.getGuid(), series.dataEntity, series.entityConstraint, sortAttribute, series.sortOrder || "asc", references.attributes, references.references)
                    .then(mxObjects => resolve({ data: mxObjects, series }))
                    .catch(reject);
            } else if (series.dataSourceType === "microflow" && series.dataSourceMicroflow) {
                fetchByMicroflow(series.dataSourceMicroflow, mxObject.getGuid())
                    .then(mxObjects => resolve({ data: mxObjects, series }))
                    .catch(reject);
            }
        } else {
            resolve();
        }
    });

const getReferences = (series: SeriesProps): ReferencesSpec => {
    let references: ReferencesSpec = { attributes: [] };
    references = addPathReference(references, series.xValueAttribute);
    references = addPathReference(references, series.yValueAttribute);
    references = addPathReference(references, series.xValueSortAttribute || series.xValueAttribute);
    if (series.bubbleSizeAttribute) {
        references = addPathReference(references, series.bubbleSizeAttribute);
    }
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
                    if (parent.attributes) {
                        parent.attributes.push(part);
                    } else {
                        parent.attributes = [ part ];
                    }
                }
            } else {
                if (!parent.references) {
                    parent.references = { [part]: { } };
                } else if (!parent.references[part]) {
                    parent.references[part] = {};
                }
            }
        }
        return referenceSet;
    }, references);

export const fetchByXPath = (guid: string, entity: string, constraint: string, sortBy?: string, sortOrder: SortOrder = "asc", attributes?: string[], references?: any /* ReferencesSpec */): Promise<mendix.lib.MxObject[]> =>
    new Promise((resolve, reject) => {
        const entityPath = entity.split("/");
        const entityName = entityPath.length > 1 ? entityPath[entityPath.length - 1] : entity;
        const xpath = "//" + entityName + constraint.split("[%CurrentObject%]").join(guid);
        window.mx.data.get({
            callback: resolve,
            error: error => reject(`An error occurred while retrieving data via XPath (${xpath}): ${error.message}`),
            xpath,
            filter: {
                sort: sortBy && sortBy.indexOf("/") === -1 ? [ [ sortBy, sortOrder ] ] : [],
                references,
                attributes
            }
        });
    });

export const fetchByMicroflow = (actionname: string, guid: string): Promise<mendix.lib.MxObject[]> =>
    new Promise((resolve, reject) => {
        const errorMessage = `An error occurred while retrieving data by microflow (${actionname}): `;
        window.mx.ui.action(actionname, {
            callback: (mxObjects: mendix.lib.MxObject[]) => resolve(mxObjects),
            error: error => reject(`${errorMessage} ${error.message}`),
            params: { applyto: "selection", guids: [ guid ] }
        });
    });

export const handleOnClick = <T extends EventProps>(options: T, mxObject?: mendix.lib.MxObject, mxform?: mxui.lib.form._FormBase) => {
    if (!mxObject || options.onClickEvent === "doNothing") {
        return;
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
        const context = new mendix.lib.MxContext();
        context.setContext(mxObject.getEntity(), mxObject.getGuid());
        window.mx.ui.openForm(options.onClickPage, {
            context,
            error: error => window.mx.ui.error(`Error while opening page ${options.onClickPage}: ${error.message}`)
        });
    }
};

export const getSeriesTraces = ({ data, series }: SeriesData): ScatterTrace => {
    const xData = data ? data.map(mxObject => getAttributeValue(mxObject, series.xValueAttribute)) : [];
    const yData = data ? data.map(mxObject => parseFloat(mxObject.get(series.yValueAttribute) as string)) : [];
    const sizeData = data && series.bubbleSizeAttribute ? data.map(mxObject => parseFloat(mxObject.get(series.bubbleSizeAttribute as string) as string)) : undefined;
    const sortData = data && series.xValueSortAttribute ? data.map(mxObject => getAttributeValue(mxObject, series.xValueSortAttribute)) : [];
    const sortDataError = xData.length !== yData.length || xData.length !== sortData.length;
    const alreadySorted = series.dataSourceType === "XPath" && series.xValueSortAttribute && series.xValueSortAttribute.split("/").length === 1;
    if (!series.xValueSortAttribute || alreadySorted || sortDataError) {
        return {
            x: xData,
            y: yData,
            size: sizeData
        };
    }
    const unsorted = sortData.map((value, index) => {
        return {
            x: xData[index],
            y: yData[index],
            size: sizeData && sizeData[index],
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
    const sortedSizeData = sizeData && sorted.map(value => value.size as number);

    return {
        x: sortedXData,
        y: sortedYData,
        size: sortedSizeData
    };
};

export const getRuntimeTraces = ({ data, series }: SeriesData): ({ name: string } & ScatterTrace) =>
    ({ name: series.name, ...getSeriesTraces({ data, series }) });

export const getAttributeValue = (mxObject: mendix.lib.MxObject, attribute: string): Datum => {
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
