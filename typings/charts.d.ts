declare function require(name: string): string;

type VisibilityMap<T> = {
    [P in keyof T]: boolean;
};

declare module "plotly.js/dist/plotly" {
    export = Plotly;
}
