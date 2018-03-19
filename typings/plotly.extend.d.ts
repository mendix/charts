// tslint:disable max-line-length
import { Font } from "plotly.js";

declare module "plotly.js" {
    /**
     *  registers individual modules for custom import
     */
    export const register: (modules: any[]) => void;

    export type BarMode = "group" | "stack";
    export interface Layout {
        barmode: BarMode;
        showarrow: boolean;
    }

    export interface Margin {
        t: number;
        b: number;
        l: number;
        r: number;
        pad: number;
    }

    export interface ScatterHoverData<T> {
        event: MouseEvent;
        points: Array<{
            x: string | number;
            y: string | number;
            z?: number;
            pointNumber: number;
            curveNumber: number;
            data: ScatterData;
            xaxis: {
                d2p: (point: string | number) => number;
                l2p: (point: number) => number;
                _offset: number;
            };
            yaxis: {
                l2p: (point: number) => number; // l2p = linear-to-pixel
                d2p: (point: string) => number;
                _offset: number;
            };
            customdata: T;
            text: string;
        }>;
    }

    interface LayoutFont {
        family: string[];
        size: number;
        color: string;
    }

    export interface PieHoverData {
        event: MouseEvent;
        points: Array<{
            cx: number;
            cy: number;
            pointNumber: number;
            curveNumber: number;
            color: string;
            label: string;
            text: string;
        }>;
    }

    export interface ScatterData {
        series: any; // custom property, not part of the official plotly.js api
        orientation?: "h" | "v";
        customdata: any[];
    }

    export interface PieData {
        hole: number;
        hoverinfo?: "label" | "percent" | "name" | "label+percent" | "label+name" | "percent+name" | "label+percent+name" | "skip" | "none";
        labels: string[];
        name?: string;
        type: "pie";
        values: number[];
        marker?: {
            colors: string[];
        };
        sort?: boolean; // default: true
    }

    export interface HeatMapData {
        x: string[];
        y: string[];
        z: number[][];
        type: "heatmap";
        zsmooth: "fast" | "best" | false;
        hoverinfo?: "label" | "percent" | "name" | "label+percent" | "label+name" | "percent+name" | "label+percent+name" | "skip" | "none";
        colorscale?: (string | number)[][];
        showscale?: boolean;
        xgap?: number;
        ygap?: number;
        colorbar?: Partial<{
            outlinecolor: string;
            y: number;
            yanchor: string;
            ypad: number;
            xpad: number;
        }>;
    }

    export interface PlotlyHTMLElement extends HTMLElement {
        on(event: "plotly_hover" | "plotly_click", callback: (data: PieHoverData) => void): void;
    }
}
