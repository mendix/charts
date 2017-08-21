export interface DataSourceProps {
    dataSourceMicroflow: string;
    dataSourceType: "XPath" | "microflow";
    entityConstraint: string;
    seriesEntity: string;
    seriesNameAttribute: string;
    dataEntity: string;
    xAxisLabel: string;
    xValueAttribute: string;
    yAxisLabel: string;
    yValueAttribute: string;
    xAxisSortAttribute: string;
}
export type MxObject = mendix.lib.MxObject;
type FetchDataCallback = (objects?: mendix.lib.MxObject[], error?: string) => void;

export const fetchData = <T extends DataSourceProps>(mxObject: mendix.lib.MxObject, dataOptions: T, callback: FetchDataCallback) => { // tslint:disable max-line-length
    if (dataOptions.seriesEntity) {
        if (dataOptions.dataSourceType === "XPath") {
            fetchByXPath(mxObject.getGuid(), dataOptions.seriesEntity, dataOptions.entityConstraint, callback);
        } else if (dataOptions.dataSourceType === "microflow" && dataOptions.dataSourceMicroflow) {
            fetchByMicroflow(dataOptions.dataSourceMicroflow, mxObject.getGuid(), callback);
        }
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

export const fetchDataFromSeries = (series: MxObject[], dataEntity: string, sortAttribute: string, callback: (series?: MxObject, data?: MxObject[], isFinal?: boolean, error?: Error) => void) => // tslint:disable max-line-length
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
