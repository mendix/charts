import { ReactElement, createElement } from "react";

export interface DataSourceProps {
    name: string;
    dataSourceMicroflow: string;
    dataSourceType: "XPath" | "microflow";
    entityConstraint: string;
    dataEntity: string;
    xValueAttribute: string;
    yValueAttribute: string;
    xAxisSortAttribute: string;
}

export type MxObject = mendix.lib.MxObject;
type FetchDataCallback = (objects?: mendix.lib.MxObject[], error?: string) => void;

export interface OnClickProps {
    onClickEvent: OnClickOptions;
    onClickPage: string;
    onClickMicroflow: string;
}
type OnClickOptions = "doNothing" | "showPage" | "callMicroflow";

export const validateSeriesProps = <T extends DataSourceProps>(dataSeries: T[], widgetId: string): string | ReactElement<any> => { // tslint:disable-line max-line-length
    if (dataSeries && dataSeries.length) {
        const errorMessage: string[] = [];
        dataSeries.forEach(series => {
            if (series.dataSourceType === "microflow" && !series.dataSourceMicroflow) {
                errorMessage.push(`\n'Data source type' in series '${series.name}' is set to 'Microflow' but the microflow is missing.`); // tslint:disable-line max-line-length
            }
        });

        if (errorMessage.length) {
            return createElement("div", {},
                `Configuration error in widget ${widgetId}:`,
                errorMessage.map((message, key) => createElement("p", { key }, message))
            );
        }
    }

    return "";
};

export const fetchSeriesData = <T extends DataSourceProps>(mxObject: MxObject, seriesProps: T, callback: FetchDataCallback) => { // tslint:disable max-line-length
    if (seriesProps.dataEntity) {
        if (seriesProps.dataSourceType === "XPath") {
            fetchByXPath(mxObject.getGuid(), seriesProps.dataEntity, seriesProps.entityConstraint, callback);
        } else if (seriesProps.dataSourceType === "microflow" && seriesProps.dataSourceMicroflow) {
            fetchByMicroflow(seriesProps.dataSourceMicroflow, mxObject.getGuid(), callback);
        }
    } else {
        callback();
    }
};

export const fetchByXPath = (guid: string, entity: string, constraint: string, callback: FetchDataCallback) => {
    const entityPath = entity.split("/");
    const entityName = entityPath.length > 1 ? entityPath[entityPath.length - 1] : entity;
    const xpath = "//" + entityName + (constraint ? constraint.replace("[%CurrentObject%]", guid) : "");
    const errorMessage = `An error occurred while retrieving data via XPath (${xpath}): `;
    window.mx.data.get({
        callback: mxObjects => callback(mxObjects),
        error: error => callback(undefined, `${errorMessage} ${error.message}`),
        xpath
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
