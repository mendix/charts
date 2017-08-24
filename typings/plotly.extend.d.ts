// tslint:disable max-line-length
import "plotly.js";

declare module "plotly.js" {
    export type BarMode = "group" | "stack";
    export interface Layout {
        barmode: BarMode;
    }
}
