import { ReactElement, createElement } from "react";
import { LineMode } from "./types";
import { Datum } from "plotly.js";

export interface DataSourceProps {
    name: string;
    dataSourceMicroflow: string;
    dataSourceType: "XPath" | "microflow";
    entityConstraint: string;
    dataEntity: string;
    xValueAttribute: string;
    yValueAttribute: string;
    xValueSortAttribute: string;
    seriesOptions: string;
    sampleData: string;
}

export type MxObject = mendix.lib.MxObject;

export interface EventProps {
    onClickEvent: "doNothing" | "showPage" | "callMicroflow";
    onClickPage: string;
    onClickMicroflow: string;
    tooltipForm: string;
}

export interface SeriesProps extends DataSourceProps, EventProps {
    name: string;
    mode?: LineMode;
    lineColor: string;
    lineStyle: "linear" | "spline";
}

export interface SeriesData {
    data: mendix.lib.MxObject[];
    series: SeriesProps;
}

export interface ScatterTrace {
    x: Datum[];
    y: number[] | Datum[];
}

export const validateSeriesProps = <T extends DataSourceProps>(dataSeries: T[], widgetId: string, layoutOptions: string): string | ReactElement<any> => { // tslint:disable-line max-line-length
    if (dataSeries && dataSeries.length) {
        const errorMessage: string[] = [];
        dataSeries.forEach(series => {
            if (series.dataSourceType === "microflow" && !series.dataSourceMicroflow) {
                errorMessage.push(`\n'Data source type' in series '${series.name}' is set to 'Microflow' but the microflow is missing.`); // tslint:disable-line max-line-length
            }
            if (series.seriesOptions && series.seriesOptions.trim()) {
                const error = validateAdvancedOptions(series.seriesOptions.trim());
                if (error) {
                    errorMessage.push(`Invalid options JSON for series "${series.name}": ${error}`);
                }
            }
            if (series.sampleData && series.sampleData.trim()) {
                const error = validateAdvancedOptions(series.sampleData.trim());
                if (error) {
                    errorMessage.push(`Invalid sample data JSON for series "${series.name}": ${error}`);
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
        if (!rawData) {
            return "";
        }
        try {
            JSON.parse(rawData);
        } catch (error) {
            return error.message;
        }

        return "";
};

export const fetchSeriesData = <T extends DataSourceProps>(mxObject: MxObject, series: T): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (series.dataEntity) {
            if (series.dataSourceType === "XPath") {
                fetchByXPath(mxObject.getGuid(), series.dataEntity, series.entityConstraint, series.xValueSortAttribute)
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
};

export const fetchByXPath = (guid: string, entity: string, constraint: string, sortBy?: string): Promise<MxObject[]> => {
    return new Promise((resolve, reject) => {
        const entityPath = entity.split("/");
        const entityName = entityPath.length > 1 ? entityPath[entityPath.length - 1] : entity;
        const xpath = "//" + entityName + (constraint ? constraint.replace("[%CurrentObject%]", guid) : "");
        const errorMessage = `An error occurred while retrieving data via XPath (${xpath}): `;
        window.mx.data.get({
            callback: resolve,
            error: error => reject(`${errorMessage} ${error.message}`),
            xpath,
            filter: {
                sort: sortBy ? [ [ sortBy, "asc" ] ] : []
            }
        });
    });
};

export const fetchByMicroflow = (actionname: string, guid: string): Promise<MxObject[]> => {
    return new Promise((resolve, reject) => {
        const errorMessage = `An error occurred while retrieving data by microflow (${actionname}): `;
        mx.ui.action(actionname, {
            callback: mxObjects => resolve(mxObjects as MxObject[]),
            error: error => reject(`${errorMessage} ${error.message}`),
            params: { applyto: "selection", guids: [ guid ] }
        });
    });
};

export const handleOnClick = <T extends EventProps>(options: T, mxObject?: MxObject) => {
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

export const getSeriesTraces = ({ data, series }: SeriesData): ScatterTrace => {
    if (data) {
        return {
            x: data.map(mxObject => getXValue(mxObject, series)),
            y: data.map(mxObject => parseInt(mxObject.get(series.yValueAttribute) as string, 10))
        };
    }

    return { x: [], y: [] };
};

export const getRuntimeTraces = ({ data, series }: SeriesData): ({ name: string } & ScatterTrace) => {
    return { name: series.name, ...getSeriesTraces({ data, series }) };
};

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

    return mxObject.get(series.xValueAttribute) as Datum;
};

export const parseDate = (date: Date): string => {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

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
