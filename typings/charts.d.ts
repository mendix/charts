declare function require(name: string): string;

type VisibilityMap<T> = {
    [P in keyof T]: any;
};

declare module "plotly.js/dist/plotly-basic" {
    export = Plotly;
}
declare module "plotly.js/dist/plotly" {
    export = Plotly;
}

declare module "*.json";
