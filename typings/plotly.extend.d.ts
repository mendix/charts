// tslint:disable max-line-length
import "plotly.js";

declare module "plotly.js" {
    export type BarMode = "group" | "stack";
    export interface Layout {
        barmode: BarMode;
    }

    export interface ClickHoverData {
        event: MouseEvent;
        points: Array<{
            x: string | number;
            y: number;
            pointNumber: number;
            curveNumber: number;
            data: ScatterData;
            xaxis: {
                d2p: (point: string | number) => number;
                _offset: number;
            };
            yaxis: {
                l2p: (point: number) => number;
                _offset: number;
            };
        }>;
    }

    export interface ScatterData {
        mxObjects: mendix.lib.MxObject[]; // custom property, not part of the official plotly.js api
    }
}
