declare function require(name: string): string;

type VisibilityMap<T> = {
    [P in keyof T]: any;
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

declare module "react-ace" {
    import { Editor } from "brace";

    export type Mode = "json" | "javascript";

    export interface ReactAceProps {
        mode: Mode;
        value: string;
        defaultValue?: string;
        readOnly?: boolean;
        theme: "github";
        className?: string;
        maxLines?: number;
        minLines?: number;
        onValidate?: (annotations: object[]) => void;
        onChange?: (value: string) => void;
        editorProps?: Partial<Editor>;
    }

    const ReactAce: React.ComponentClass<ReactAceProps>;

    export { ReactAce as default };
}
