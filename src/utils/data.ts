export interface DataSourceProps {
    dataSourceMicroflow: string;
    dataSourceType: "XPath" | "microflow";
    entityConstraint: string;
    dataEntity: string;
    xAxisLabel: string;
    xValueAttribute: string;
    yAxisLabel: string;
    yValueAttribute: string;
    xAxisSortAttribute: string;
}

export interface DynamicDataSourceProps extends DataSourceProps {
    seriesEntity: string;
    seriesNameAttribute: string;
}

export type MxObject = mendix.lib.MxObject;
type FetchDataCallback = (objects?: mendix.lib.MxObject[], error?: string) => void;

export interface OnClickProps {
    onClickEvent: OnClickOptions;
    onClickPage: string;
    onClickMicroflow: string;
}
type OnClickOptions = "doNothing" | "showPage" | "callMicroflow";

export const fetchSeriesData = <T extends DataSourceProps>(mxObject: MxObject, entity: string, dataOptions: T, callback: FetchDataCallback) => { // tslint:disable max-line-length
    if (entity) {
        if (dataOptions.dataSourceType === "XPath") {
            fetchByXPath(mxObject.getGuid(), entity, dataOptions.entityConstraint, callback);
        } else if (dataOptions.dataSourceType === "microflow" && dataOptions.dataSourceMicroflow) {
            fetchByMicroflow(dataOptions.dataSourceMicroflow, mxObject.getGuid(), callback);
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

type DynamicSeriesDataCallback = (series?: MxObject, data?: MxObject[], isFinal?: boolean, error?: Error) => void;

export const fetchDataFromSeries = (series: MxObject[], dataEntity: string, sortAttribute: string, callback: DynamicSeriesDataCallback) => // tslint:disable max-line-length
    series.forEach((activeSeries, index) => {
        const dataEntityPath = dataEntity.split("/");
        const xpath = `//${dataEntityPath[1]}[${dataEntityPath[0]} = ${activeSeries.getGuid()}]`;
        window.mx.data.get({
            callback: mxObjects => callback(activeSeries, mxObjects, series.length === index + 1),
            error: error => callback(undefined, undefined, false, error),
            filter: { sort: [ [ sortAttribute, "asc" ] ] },
            xpath
        });
    });

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
