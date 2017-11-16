declare module "react-ace" {
    import { Editor } from "brace";

    export type Mode = "json" | "javascript";

    export interface Marker {
        startRow: number;
        startCol?: number;
        endRow?: number;
        endCol?: number;
        className: string;
        type?: "screenLine" | "fullLine" | "text";
        inFront?: boolean;
    }

    export interface ReactAceProps {
        mode: Mode;
        value: string;
        defaultValue?: string;
        readOnly?: boolean;
        theme: "github";
        className?: string;
        markers?: Marker[];
        maxLines?: number;
        minLines?: number;
        showGutter?: boolean;
        onValidate?: (annotations: object[]) => void;
        onChange?: (value: string) => void;
        editorProps?: Partial<Editor>;
    }

    const ReactAce: React.ComponentClass<ReactAceProps>;

    export { ReactAce as default };
}
