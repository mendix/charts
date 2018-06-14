import { HeatMapDataHandlerProps } from "../components/HeatMapDataHandler";
import { fetchByXPath } from "../../utils/data";
import { Container, Data } from "../../utils/namespaces";
import { HeatMapData } from "plotly.js";

interface ProcessedData {
    data: HeatMapData;
    mxObjects: mendix.lib.MxObject[];
}
export const fetchSortedData = (props: HeatMapDataHandlerProps): Promise<ProcessedData> => {
    return new Promise((resolve, reject) => {
        const { dataEntity, entityConstraint, horizontalSortAttribute, horizontalSortOrder, mxObject } = props;
        if (mxObject) {
            const fetchOptions = {
                guid: mxObject.getGuid(),
                entity: dataEntity,
                constraint: entityConstraint
            };
            fetchByXPath({
                ...fetchOptions,
                sortAttribute: horizontalSortAttribute,
                sortOrder: horizontalSortOrder
            }).then(horizontalData => {
                // TODO: verify that data object subscription occurs
                const horizontalValues = getValues(props.horizontalNameAttribute, horizontalData);
                const { verticalSortAttribute, verticalSortOrder } = props;
                fetchByXPath({
                    ...fetchOptions,
                    sortAttribute: verticalSortAttribute,
                    sortOrder: verticalSortOrder
                }).then(verticalData => {
                    const verticalValues = getValues(props.verticalNameAttribute, verticalData);
                    resolve({
                        mxObjects: horizontalData,
                        data: {
                            x: horizontalValues,
                            y: verticalValues,
                            z: processZData(props, verticalValues, horizontalValues, verticalData),
                            zsmooth: props.smoothColor ? "best" : false,
                            colorscale: processColorScale(props.scaleColors),
                            showscale: props.showScale,
                            type: "heatmap"
                        }
                    });
                });
            }).catch(reason => {
                reject(`An error occurred while retrieving sorted chart data: ${reason}`);
            });
        }
    });
};

export const processZData = (props: HeatMapDataHandlerProps, vertical: string[], horizontal: string[], data: mendix.lib.MxObject[], restData?: Data.RESTData): number[][] => {
    const verticalAttribute = getAttributeName(props.verticalNameAttribute);
    const horizontalAttribute = getAttributeName(props.horizontalNameAttribute);

    if (data && data.length) {
        return vertical.map(verticalValues =>
            horizontal.map(horizontalValues => {
                const zData = data.find(value =>
                    value.get(verticalAttribute) === verticalValues &&
                    value.get(horizontalAttribute) === horizontalValues
                );

                return zData ? Number(zData.get(props.valueAttribute)) : 0;
            })
        );
    } else if (restData && restData.length) {
        return vertical.map(verticalValues =>
            horizontal.map(horizontalValues => {
                const zData = restData.find(value =>
                    value[verticalAttribute] === verticalValues &&
                    value[horizontalAttribute] === horizontalValues
                );

                return zData ? Number(zData[props.valueAttribute]) : 0;
            })
        );
    }

    return [];
};

export const getValues = (attribute: string, data: mendix.lib.MxObject[], restData?: Data.RESTData): string[] => {
    const values: string[] = [];
    const attributeName = getAttributeName(attribute);
    if (data && data.length) {
        data.forEach(item => {
            const value = item.get(attributeName) as string;
            if (values.indexOf(value) === -1) {
                values.push(value);
            }
        });
    } else if (restData && restData.length) {
        restData.forEach(item => {
            const value = item[attributeName] as string;
            if (values.indexOf(value) === -1) {
                values.push(value);
            }
        });
    }

    return values;
};

export const getAttributeName = (attributePath: string): string => {
    const attributeSplit = attributePath.split("/");

    return attributeSplit[attributeSplit.length - 1];
};

export const processColorScale = (scaleColors: Container.ScaleColors[]): (string | number)[][] => {
    return scaleColors.length > 1
        ? scaleColors
            .sort((colour1, colour2) => colour1.valuePercentage - colour2.valuePercentage)
            .map(colors => [ Math.abs(colors.valuePercentage / 100), colors.colour ])
        : [ [ 0, "#17347B" ], [ 0.5, "#0595DB" ], [ 1, "#76CA02" ] ];
};
