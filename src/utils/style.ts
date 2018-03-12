import { Style } from "./namespaces";
import { CSSProperties } from "react";

export const parseStyle = (style = ""): {[key: string]: string} => { // Doesn't support a few stuff.
    try {
        return style.split(";").reduce<{[key: string]: string}>((styleObject, line) => {
            const pair = line.split(":");
            if (pair.length === 2) {
                const name = pair[0].trim().replace(/(-.)/g, match => match[1].toUpperCase());
                styleObject[name] = pair[1].trim();
            }
            return styleObject;
        }, {});
    } catch (error) {
        window.console.log("Failed to parse style", style, error); // tslint:disable-line no-console
    }

    return {};
};

export const getDimensions = <T extends Style.Dimensions>(props: T): CSSProperties => {
    const style: CSSProperties = {
        width: props.widthUnit === "percentage" ? `${props.width}%` : `${props.width}px`
    };
    if (props.heightUnit === "percentageOfWidth") {
        style.paddingBottom = `${props.height}%`;
    } else if (props.heightUnit === "pixels") {
        style.height = `${props.height}px`;
    } else if (props.heightUnit === "percentageOfParent") {
        style.height = `${props.height}%`;
    }

    return style;
};

export const defaultColours = (opacity = 1) => [
    `rgba(5, 149, 219, ${opacity})`,
    `rgba(23, 52, 123, ${opacity})`,
    `rgba(118, 202, 2, ${opacity})`
];
export const fillColours = [ "rbg(5,149,219,5)", "rbg(23,52,123,5)", "rbg(118,202,2,5)" ];
