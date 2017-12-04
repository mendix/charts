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

export interface RenderAceEditorOptions {
    value: string;
    onChange?: (value: string) => void;
    onValidate: (annotations: object[]) => void;
    readOnly?: boolean;
    overwriteValue?: string;
}

<<<<<<< HEAD
export class Playground extends Component<{}, PlaygroundState> {
    state = {
        showEditor: false,
        showTooltip: false
    };
=======
type PlaygroundSeriesTrace = ({ name: string } & ScatterTrace);

export class Playground extends Component<PlaygroundProps, PlaygroundState> {
    private newSeriesOptions: { layout: string, data: SeriesData[] };
    private newPieOptions: { layout: string, data: string };
    private newAnyOptions: { [index: string]: string, layoutStatic: string, dataStatic: string, layoutDynamic: string, dataDynamic: string };
    private timeoutId: number;
    private isValid: boolean;

    constructor(props: PlaygroundProps) {
        super(props);

        this.updateChart = this.updateChart.bind(this);
        this.onValidate = this.onValidate.bind(this);
        this.toggleShowEditor = this.toggleShowEditor.bind(this);
        this.closeEditor = this.closeEditor.bind(this);
        this.closeTooltip = this.closeTooltip.bind(this);
        this.toggleTooltip = this.toggleTooltip.bind(this);
        this.updateView = this.updateView.bind(this);
        this.state = {
            showEditor: false,
            showTooltip: false,
            activeOption: "layout"
        };
        this.newSeriesOptions = {
            layout: props.layoutOptions || "{}",
            data: props.series && props.series.rawData || []
        };
        this.newPieOptions = {
            layout: props.layoutOptions || "{}",
            data: props.pie && props.pie.dataOptions || "{\n\n}"
        };
    }
>>>>>>> Move Playground to AnyContainer

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

<<<<<<< HEAD
    private closeTooltip = () => {
        if (this.state.showTooltip) {
            this.setState({ showTooltip: false });
=======
    private renderAnyDataPanes() {
        if (this.props.any) {
            const { dataDynamic, dataStatic } = this.props.any;
            return [
                createElement(Panel,
                    {
                        key: "dataDynamic",
                        heading: "Dynamic data",
                        headingClass: "item-header"
                    },
                    this.renderAceEditor(`${dataDynamic}`, value => this.onUpdate("dataDynamic", value))
                ),
                createElement(Panel,
                    {
                        key: "dataStatic",
                        heading: "Static data",
                        headingClass: "item-header"
                    },
                    this.renderAceEditor(`${dataStatic}`, value => this.onUpdate("dataStatic", value), false, "json", dataDynamic)
                )
            ];
>>>>>>> Move Playground to AnyContainer
        }
    }

<<<<<<< HEAD
    private toggleTooltip = () => {
        this.setState({ showTooltip: !this.state.showTooltip });
=======
    private renderAnyLayoutPanes() {
        if (this.props.any) {
            const { layoutStatic, layoutDynamic } = this.props.any;
            return [
                createElement(Panel,
                    {
                        key: "layoutDynamic",
                        heading: "Dynamic layout",
                        headingClass: "item-header"
                    },
                    this.renderAceEditor(`${layoutDynamic}`, value => this.onUpdate("layoutDynamic", value))
                ),
                createElement(Panel,
                    {
                        key: "layoutStatic",
                        heading: "Static layout",
                        headingClass: "item-header"
                    },
                    this.renderAceEditor(`${layoutStatic}`, value => this.onUpdate("layoutStatic", value), false, "json", layoutDynamic)
                )
            ];
        }

        return null;
>>>>>>> Move Playground to AnyContainer
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

<<<<<<< HEAD
    private static getMarker(left: string, right?: string): Marker[] {
=======
    private updateView({ currentTarget }: SyntheticEvent<HTMLSelectElement>) {
        this.setState({ activeOption: currentTarget.value });
    }

    private toggleShowEditor() {
        this.setState({ showEditor: !this.state.showEditor });
    }

    private closeEditor() {
        if (this.state.showEditor) {
            this.setState({ showEditor: false });
        }
    }

    private closeTooltip() {
        if (this.state.showTooltip) {
            this.setState({ showTooltip: false });
        }
    }

    private toggleTooltip() {
        this.setState({ showTooltip: !this.state.showTooltip });
    }

    private onUpdate(source: string, value: string) {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => {
            try {
                if (this.isValid && JSON.parse(value)) {
                    this.updateChart(source, value);
                }
            } catch {
                this.isValid = false;
            }
        }, 1000);
    }

    private onValidate(annotations: object[]) {
        this.isValid = !annotations.length;
    }

    private updateChart(source: string, value: string) {
        const cleanValue = Playground.removeTrailingNewLine(value);
        if (source === "layout") {
            this.newSeriesOptions.layout = cleanValue;
        }
        if (source.indexOf("series") > -1) {
            const index = source.split("-")[ 1 ];
            (this.newSeriesOptions.data[ parseInt(index, 10) ] as SeriesData).series.seriesOptions = cleanValue;
        } else if (source.indexOf("data") > -1) {
            this.newPieOptions.data = cleanValue;
        }
        if (this.props.series && this.props.series.onChange) {
            this.props.series.onChange(this.newSeriesOptions.layout, this.newSeriesOptions.data);
        }
        if (this.props.pie && this.props.pie.onChange) {
            this.props.pie.onChange(this.newSeriesOptions.layout, this.newPieOptions.data);
        }
        if (this.props.any && this.props.any.onChange) {
            this.newAnyOptions = {
                layoutStatic: this.props.any.layoutStatic || "{}",
                dataStatic: this.props.any.dataStatic || "[]",
                layoutDynamic: this.props.any.layoutDynamic || "{}",
                dataDynamic: this.props.any.dataDynamic || "[]"
            };
            this.newAnyOptions[source] = value;
            this.props.any.onChange(this.newAnyOptions.layoutStatic, this.newAnyOptions.dataStatic, this.newAnyOptions.layoutDynamic, this.newAnyOptions.dataDynamic);
        }
    }

    private getMarker(left: string, right?: string): Marker[] {
>>>>>>> Move Playground to AnyContainer
        const markers: Marker[] = [];
        if (right) {
            const diffs = compare(JSON.parse(left), JSON.parse(right));
            diffs.forEach(diff => {
                if (diff.op === "replace") {
                    const pos = Playground.getStartAndEndPosOfDiff(left, diff);
                    if (pos) {
                        markers.push(pos);
                    }
                }
            });
        }

        return markers;
    }

    private static getStartAndEndPosOfDiff(textValue: string, diff: Operation): Marker | null {
        const result = jsonMap.parse(textValue);
        const pointer = result.pointers[diff.path];
        if (pointer && pointer.key && pointer.valueEnd) {
            return {
                startRow: pointer.key.line,
                startCol: pointer.key.column,
                endRow: pointer.valueEnd.line,
                endCol: pointer.valueEnd.column,
                type: "text",
                className: "replaced-config"
            };
        }

        return null;
    }

    public static convertJSToJSON(value: string) {
        const properJSON = value.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, `"$2": `).replace(/'/g, `"`);

        return JSON.stringify(JSON.parse(properJSON), null, 2);
    }
}
