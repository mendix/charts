export type MxObject = mendix.lib.MxObject;
type FetchDataCallback = (objects?: mendix.lib.MxObject[], error?: Error) => void;

export const fetchByXPath = (guid: string, entity: string, constraint: string, callback: FetchDataCallback) => {
    const entityPath = entity.split("/");
    const entityName = entityPath.length > 1 ? entityPath[entityPath.length - 1] : entity;
    window.mx.data.get({
        callback: mxObjects => callback(mxObjects),
        error: error => callback(undefined, error),
        xpath: "//" + entityName + (constraint ? constraint.replace("[%CurrentObject%]", guid) : "")
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

export const fetchByMicroflow = (actionname: string, guid: string, callback: FetchDataCallback) =>
    mx.ui.action(actionname, {
        callback: mxObjects => callback(mxObjects as MxObject[]),
        error: error => callback(undefined, error),
        params: { applyto: "selection", guids: [ guid ] }
    });
