import { ReactChild, createElement } from "react";
import { Datum } from "plotly.js";
import { Data } from "./namespaces";
import SeriesProps = Data.SeriesProps;
import SeriesData = Data.SeriesData;
import SortOrder = Data.SortOrder;
import EventProps = Data.EventProps;
import ScatterTrace = Data.ScatterTrace;

export const validateSeriesProps = <T extends Partial<SeriesProps>>(dataSeries: T[], widgetId: string, layoutOptions: string): ReactChild => { // tslint:disable-line max-line-length
    if (dataSeries && dataSeries.length) {
        const errorMessage: string[] = [];
        dataSeries.forEach(series => {
            const identifier = series.name ? `series "${series.name}"` : "the widget";
            if (series.dataSourceType === "microflow" && !series.dataSourceMicroflow) {
                errorMessage.push(`\n'Data source type' in ${identifier} is set to 'Microflow' but no microflow is specified.`); // tslint:disable-line max-line-length
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

export const fetchSeriesData = (mxObject: mendix.lib.MxObject, series: SeriesProps): Promise<SeriesData> =>
    new Promise<SeriesData>((resolve, reject) => {
        if (series.dataEntity) {
            if (series.dataSourceType === "XPath") {
                fetchByXPath(mxObject.getGuid(), series.dataEntity, series.entityConstraint, series.xValueSortAttribute, series.sortOrder)
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

export const fetchByXPath = (guid: string, entity: string, constraint: string, sortBy?: string, sortOrder: SortOrder = "asc"): Promise<mendix.lib.MxObject[]> =>
    new Promise((resolve, reject) => {
        const entityPath = entity.split("/");
        const entityName = entityPath.length > 1 ? entityPath[entityPath.length - 1] : entity;
        const xpath = "//" + entityName + constraint.replace("[%CurrentObject%]", guid);
        window.mx.data.get({
            callback: resolve,
            error: error => reject(`An error occurred while retrieving data via XPath (${xpath}): ${error.message}`),
            xpath,
            filter: {
                sort: sortBy ? [ [ sortBy, sortOrder ] ] : []
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

export const handleOnClick = <T extends EventProps>(options: T, mxObject?: mendix.lib.MxObject) => {
    if (!mxObject || options.onClickEvent === "doNothing") {
        return;
    }
    if (options.onClickEvent === "callMicroflow" && options.onClickMicroflow) {
        window.mx.ui.action(options.onClickMicroflow, {
            error: error => window.mx.ui.error(`Error while executing microflow ${options.onClickMicroflow}: ${error.message}`), // tslint:disable-line max-line-length
            params: {
                applyto: "selection",
                guids: [ mxObject.getGuid() ]
            }
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

export const getSeriesTraces = ({ data, series }: SeriesData): ScatterTrace =>
    ({
        x: data ? data.map(mxObject => getXValue(mxObject, series)) : [],
        y: data ? data.map(mxObject => parseInt(mxObject.get(series.yValueAttribute) as string, 10)) : []
    });

export const getRuntimeTraces = ({ data, series }: SeriesData): ({ name: string } & ScatterTrace) =>
    ({ name: series.name, ...getSeriesTraces({ data, series }) });

export const getXValue = (mxObject: mendix.lib.MxObject, series: SeriesProps): Datum => {
    if (mxObject.isDate(series.xValueAttribute)) {
        const timestamp = mxObject.get(series.xValueAttribute) as number;
        const date = new Date(timestamp);

        return `${parseDate(date)} ${parseTime(date)}`;
    }
    if (mxObject.isEnum(series.xValueAttribute)) {
        const enumValue = mxObject.get(series.xValueAttribute) as string;

        return mxObject.getEnumCaption(series.xValueAttribute, enumValue);
    }
    const value = mxObject.get(series.xValueAttribute);

    return value !== null ? value.toString() : "";
};

export const parseDate = (date: Date): string => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

export const parseTime = (date: Date): string => {
    const time: string[] = [];
    time.push(date.getHours() < 10 ? `0${date.getHours()}` : `${date.getHours()}`);
    time.push(date.getMinutes() < 10 ? `0${date.getMinutes()}` : `${date.getMinutes()}`);
    time.push(date.getSeconds() < 10 ? `0${date.getSeconds()}` : `${date.getSeconds()}`);

    return time.join(":");
};

export const getRandomNumbers = (count: number, range: number): number[] => {
    const numbers: number[] = [];
    for (let i = 0; i < count; i++) {
        numbers.push(Math.round(Math.random() * range));
    }

    return numbers;
};
