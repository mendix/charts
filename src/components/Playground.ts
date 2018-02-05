import { Component, ReactChild, createElement, isValidElement } from "react";
import AceEditor, { Marker } from "react-ace";
import * as classNames from "classnames";
import { Operation, compare } from "fast-json-patch";
import * as jsonMap from "json-source-map";

import { InfoTooltip } from "./InfoTooltip";
import { MendixButton } from "./MendixButton";
import { Panel } from "./Panel";
import { Select } from "./Select";
import { PlotlyChart } from "./PlotlyChart";
import { Sidebar } from "./Sidebar";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarContent } from "./SidebarContent";

import { PlaygroundInfo } from "./PlaygroundInfo";

import "brace";
import "brace/mode/json";
import "brace/theme/github";
import "../ui/Playground.scss";

interface PlaygroundState {
    showEditor: boolean;
    showTooltip: boolean;
}

interface RenderAceEditorOptions {
    value: string;
    onChange?: (value: string) => void;
    onValidate: (annotations: object[]) => void;
    readOnly?: boolean;
    overwriteValue?: string;
}

export class Playground extends Component<{}, PlaygroundState> {
    state = {
        showEditor: false,
        showTooltip: false
    };

    render() {
        return createElement("div", {
                className: classNames("widget-charts-playground", {
                    "playground-open": this.state.showEditor
                })
            },
            createElement(Sidebar,
                {
                    open: this.state.showEditor,
                    onBlur: this.closeEditor,
                    onClick: this.closeTooltip,
                    onClose: this.toggleShowEditor
                },
                createElement(SidebarHeader, { className: "row" }, this.renderContent(Select)),
                createElement(SidebarContent, {},
                    createElement(InfoTooltip, { show: this.state.showTooltip, onClick: this.toggleTooltip },
                        createElement(PlaygroundInfo)
                    ),
                    this.renderContent(Panel)
                )
            ),
            createElement("div", { className: "widget-charts-playground-toggle" },
                createElement(MendixButton, { onClick: this.toggleShowEditor }, "Toggle Editor")
            ),
            this.renderContent(PlotlyChart)
        );
    }

    private renderContent(component: typeof Panel | typeof PlotlyChart | typeof Select): ReactChild | (ReactChild | any | boolean)[] | null {
        if (this.props.children && Array.isArray(this.props.children)) {
            return this.props.children.filter(child => isValidElement(child) && child.type === component);
        } else if (isValidElement(this.props.children) && this.props.children.type === component) {
            return this.props.children;
        }

        return null;
    }

    private toggleShowEditor = () => {
        this.setState({ showEditor: !this.state.showEditor });
    }

    private closeEditor = () => {
        if (this.state.showEditor) {
            this.setState({ showEditor: false });
        }
    }

    private closeTooltip = () => {
        if (this.state.showTooltip) {
            this.setState({ showTooltip: false });
        }
    }

    private toggleTooltip = () => {
        this.setState({ showTooltip: !this.state.showTooltip });
    }

    private static getMarker(left: string, right?: string): Marker[] {
        const markers: Marker[] = [];
        if (right) {
            const diffs = compare(JSON.parse(left), JSON.parse(right));
            diffs.forEach(diff => {
                if (diff.op === "replace") {
                    const pos = Playground.getStartAndEndPosOfDiff(left, diff);
                    if (pos) {
                        markers.push({
                            startRow: pos.startRow,
                            startCol: pos.startCol,
                            endRow: pos.endRow,
                            endCol: pos.endCol,
                            type: "text",
                            className: "replaced-config"
                        });
                    }
                }
            });
        }

        return markers;
    }

    private static getStartAndEndPosOfDiff(textValue: string, diff: Operation) {
        const result = jsonMap.parse(textValue);
        const pointer = result.pointers[diff.path];
        if (pointer && pointer.key && pointer.valueEnd) {
            return {
                startRow: pointer.key.line,
                startCol: pointer.key.column,
                endRow: pointer.valueEnd.line,
                endCol: pointer.valueEnd.column
            };
        }
    }

    public static removeTrailingNewLine(value: string): string {
        const splitValue = value.split("\n");
        if (splitValue[splitValue.length - 1] === "") {
            splitValue.pop();
        }

        return splitValue.join("\n");
    }

    public static renderAceEditor(options: RenderAceEditorOptions) {
        const { onChange, onValidate, overwriteValue, readOnly, value } = options;
        const markers = Playground.getMarker(value, overwriteValue);

        return createElement(AceEditor, {
            mode: "json",
            value: `${value}\n`,
            readOnly,
            onChange,
            theme: "github",
            className: readOnly ? "ace-editor-read-only" : undefined,
            markers,
            maxLines: 1000, // crappy attempt to avoid a third scroll bar
            onValidate,
            editorProps: { $blockScrolling: Infinity },
            setOptions: { showLineNumbers: false, highlightActiveLine: false, highlightGutterLine: true }
        });
    }
}
