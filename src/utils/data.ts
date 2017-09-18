import { ReactElement, createElement } from "react";
import * as Ajv from "ajv";

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
}

export type MxObject = mendix.lib.MxObject;
type FetchDataCallback = (objects?: mendix.lib.MxObject[], error?: string) => void;

export interface OnClickProps {
    onClickEvent: "doNothing" | "showPage" | "callMicroflow";
    onClickPage: string;
    onClickMicroflow: string;
}

interface AdvancedOptions {
    dataSchema: object;
    layoutOptions: string;
    layoutSchema: object;
}

export const validateSeriesProps = <T extends DataSourceProps>(dataSeries: T[], widgetId: string, advanced: AdvancedOptions): string | ReactElement<any> => { // tslint:disable-line max-line-length
    if (dataSeries && dataSeries.length) {
        const errorMessage: string[] = [];
        dataSeries.forEach(series => {
            if (series.dataSourceType === "microflow" && !series.dataSourceMicroflow) {
                errorMessage.push(`\n'Data source type' in series '${series.name}' is set to 'Microflow' but the microflow is missing.`); // tslint:disable-line max-line-length
            }
            if (series.seriesOptions) {
                const message = validateAdvancedOptions(series.seriesOptions, advanced.dataSchema as any, series.name);
                if (message) {
                    errorMessage.push(message);
                }
            }
        });
        if (advanced.layoutOptions) {
            const message = validateAdvancedOptions(advanced.layoutOptions, advanced.layoutSchema as any);
            if (message) {
                errorMessage.push(message);
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

export const validateAdvancedOptions = (rawData: string, schema: { id: string }, series?: string): string => {
    if (!rawData) {
        return "";
    }
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    try {
        if (!validate(JSON.parse(rawData))) {
            const schemaError = ajv.errorsText(validate.errors);

            if (schema.id && schema.id.indexOf("data")) {
                return series
                    ? `Error in series "${series}" advanced data configuration: ${schemaError}`
                    : `Error in the advanced data configurations: ${schemaError}`;
            } else {
                return `Error in advanced layout options: ${schemaError}`;
            }
        }
    } catch (error) {
        if (schema.id && schema.id.indexOf("data")) {
            return series
                ? `Invalid options JSON for series "${series}": ${error.message}`
                : `Invalid options JSON: ${error.message}`;
        } else {
            return `Invalid layout JSON: ${error.message}`;
        }
    }

    return "";
};

// const validateAdvancedLayoutOptions = (options: string, schema: object): string => {
//     if (!options) {
//         return "";
//     }
//     const ajv = new Ajv();
//     const validate = ajv.compile(schema);
//     try {
//         if (!validate(JSON.parse(options))) {
//             const schemaError = ajv.errorsText(validate.errors);
//             return `Error in advanced layout options: ${schemaError}`;
//         }
//     } catch (error) {
//         return `Invalid layout JSON: ${error.message}`;
//     }
//
//     return "";
// };

export const fetchSeriesData = <T extends DataSourceProps>(mxObject: MxObject, seriesProps: T, callback: FetchDataCallback) => { // tslint:disable max-line-length
    if (seriesProps.dataEntity) {
        if (seriesProps.dataSourceType === "XPath") {
            fetchByXPath(mxObject.getGuid(), seriesProps.dataEntity, seriesProps.entityConstraint, callback, seriesProps.xValueSortAttribute);
        } else if (seriesProps.dataSourceType === "microflow" && seriesProps.dataSourceMicroflow) {
            fetchByMicroflow(seriesProps.dataSourceMicroflow, mxObject.getGuid(), callback);
        }
    } else {
        callback();
    }
};

export const fetchByXPath = (guid: string, entity: string, constraint: string, callback: FetchDataCallback, sortBy?: string) => {
    const entityPath = entity.split("/");
    const entityName = entityPath.length > 1 ? entityPath[entityPath.length - 1] : entity;
    const xpath = "//" + entityName + (constraint ? constraint.replace("[%CurrentObject%]", guid) : "");
    const errorMessage = `An error occurred while retrieving data via XPath (${xpath}): `;
    window.mx.data.get({
        callback: mxObjects => callback(mxObjects),
        error: error => callback(undefined, `${errorMessage} ${error.message}`),
        xpath,
        filter: {
            sort: sortBy ? [ [ sortBy, "asc" ] ] : []
        }
    });
};

export const fetchByMicroflow = (actionname: string, guid: string, callback: FetchDataCallback) => {
    const errorMessage = `An error occurred while retrieving data by microflow (${actionname}): `;
    mx.ui.action(actionname, {
        callback: mxObjects => callback(mxObjects as MxObject[]),
        error: error => callback(undefined, `${errorMessage} ${error.message}`),
        params: { applyto: "selection", guids: [ guid ] }
    });
};

export const handleOnClick = <T extends OnClickProps>(options: T, mxObject?: MxObject) => {
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
