declare function require(name: string): string;

type VisibilityMap<T> = {
    [P in keyof T]: boolean;
};

declare module "plotly.js/dist/plotly-basic" {
    export = Plotly;
}

declare module "element-resize-detector" {
    interface ResizeDetector {
        listenTo: (element: HTMLElement, callback: () => void) => void;
        removeListener: (element: HTMLElement, callback: () => void) => void;
    }

    interface ResizeOptions {
        strategy: "scroll";
    }

    const elementResizeDetector: (options: ResizeOptions) => ResizeDetector;

    export = elementResizeDetector;
}

declare module "*.json";

declare module "react-ace";
