declare function require(name: string): string;
declare module "plotly.js/dist/plotly" {
    const plotly: Plotly;

    export = plotly;
}
