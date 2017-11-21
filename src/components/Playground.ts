import { Component, ReactElement, SyntheticEvent, createElement } from "react";
import AceEditor, { Marker, Mode } from "react-ace";
import * as classNames from "classnames";
import { Operation, compare } from "fast-json-patch";
import jsonMap = require("json-source-map");

import { Accordion, AccordionProps } from "./Accordion";
import { Alert } from "./Alert";
import { HelpTooltip } from "./HelpTooltip";
import { MendixButton } from "./MendixButton";
import { Sidebar } from "./Sidebar";

import { ScatterTrace, SeriesData, SeriesProps } from "../utils/data";
import { PieTraces } from "../PieChart/components/PieChart";
import { PieData, ScatterData } from "plotly.js";

import "brace";
import "brace/mode/json";
import "brace/theme/github";
import "../ui/Playground.scss";

interface PlaygroundProps {
    pie?: PiePlaygroundOptions;
    series?: SeriesPlaygroundOptions;
    layoutOptions: string;
    modelerLayoutConfigs: string;
}

interface PlaygroundState {
    showEditor: boolean;
    activeOption: string;
}

interface PiePlaygroundOptions {
    dataOptions: string;
    modelerDataConfigs: string;
    chartData: Partial<PieData>[];
    traces: PieTraces;
    onChange?: (layout: string, data: string) => void;
}

interface SeriesPlaygroundOptions {
    modelerSeriesConfigs?: string[];
    rawData?: SeriesData[];
    chartData?: Partial<ScatterData>[];
    traces?: PlaygroundSeriesTrace[];
    onChange?: (layout: string, data: SeriesData[]) => void;
}

type PlaygroundSeriesTrace = ({ name: string } & ScatterTrace);

export class Playground extends Component<PlaygroundProps, PlaygroundState> {
    private newSeriesOptions: { layout: string, data: SeriesData[] };
    private newPieOptions: { layout: string, data: string };
    private timeoutId: number;
    private isValid: boolean;

    constructor(props: PlaygroundProps) {
        super(props);

        this.updateChart = this.updateChart.bind(this);
        this.onValidate = this.onValidate.bind(this);
        this.toggleShowEditor = this.toggleShowEditor.bind(this);
        this.closeEditor = this.closeEditor.bind(this);
        this.updateView = this.updateView.bind(this);

        this.state = { showEditor: false, activeOption: "layout" };
        this.newSeriesOptions = {
            layout: props.layoutOptions || "{}",
            data: props.series && props.series.rawData || []
        };
        this.newPieOptions = {
            layout: props.layoutOptions || "{}",
            data: props.pie && props.pie.dataOptions || "{\n\n}"
        };
    }

    render() {
        return createElement("div", {
                className: classNames("widget-charts-playground", {
                    "playground-open": this.state.showEditor
                })
            },
            createElement(Sidebar, { open: this.state.showEditor, onBlur: this.closeEditor },
                createElement("div", { className: "sidebar-content" },
                    createElement("div", { className: "sidebar-content-header row" },
                        createElement("div", { className: "col-sm-9 col-xs-9" }, this.renderOptions()),
                        createElement("div", { className: "col-sm-3 col-xs-3" },
                            createElement("em", {
                                className: "pull-right remove glyphicon glyphicon-remove",
                                onClick: this.toggleShowEditor
                            })
                        )
                    ),
                    createElement("div", { className: "sidebar-content-body" },
                        createElement(HelpTooltip, {}, this.renderHelpContent()),
                        this.renderContent()
                    )
                )
            ),
            createElement("div", { className: "widget-charts-playground-toggle" },
                createElement(MendixButton, { onClick: this.toggleShowEditor }, "Toggle Editor")
            ),
            this.props.children
        );
    }

    private renderOptions(): ReactElement<any> {
        if (this.props.pie) {
            return createElement("select", { className: "form-control", onChange: this.updateView },
                createElement("option", { value: "layout" }, "Layout"),
                createElement("option", { value: "data" }, "Data")
            );
        }

        return createElement("select", { className: "form-control", onChange: this.updateView },
            createElement("option", { value: "layout" }, "Layout"),
            this.renderSeriesSelectOptions()
        );
    }

    private renderSeriesSelectOptions() {
        if (this.props.series && this.props.series.rawData) {
            return this.props.series.rawData.map(({ series }, index) =>
                createElement("option", { value: index, key: `series-option-${index}` }, series.name)
            );
        }

        return [];
    }

    private renderContent() {
        if (this.state.activeOption === "layout") {
            return this.renderLayoutOptions();
        }
        if (this.props.pie && this.state.activeOption === "data") {
            return this.renderPieDataPanes();
        }
        if (this.props.series) {
            return this.renderSeriesPanes(parseInt(this.state.activeOption, 10));
        }

        return null;
    }

    private renderSeriesPanes(activeIndex: number) {
        if (this.props.series && this.props.series.rawData) {
            const activeSeriesData = this.props.series.rawData[activeIndex];

            return [
                this.renderSeriesOptions(activeSeriesData.series, activeIndex),
                this.renderSeriesModelerConfig(activeIndex)
            ];
        }

        return [];
    }

    private renderSeriesOptions(series: SeriesProps, index: number) {
        return createElement(Accordion,
            {
                title: "Custom settings",
                titleClass: "item-header",
                show: true,
                collapsible: false,
                key: `options-${index}`
            },
            this.renderAceEditor(`${series.seriesOptions || "{\n\n}"}`, value =>
                this.onUpdate(`series-${index}`, value)
            )
        );
    }

    private renderSeriesModelerConfig(index: number) {
        if (this.props.series && this.props.series.modelerSeriesConfigs && this.props.series.rawData) {
            return createElement(Accordion,
                {
                    title: "Settings from the Modeler",
                    titleClass: "item-header read-only",
                    show: true,
                    collapsible: false,
                    key: `modeler-${index}`
                },
                this.renderAceEditor(
                    this.props.series.modelerSeriesConfigs[index] || "{\n\n}",
                    undefined,
                    true,
                    "json",
                    this.props.series.rawData[index].series.seriesOptions
                )
            );
        }

        return null;

    }

    private renderHelpContent() {
        return createElement(Alert, { key: 0, bootstrapStyle: "info" },
            createElement("p", {},
                createElement("strong", {},
                    "  Changes made in this editor are only for preview purposes."
                )
            ),
            createElement("p", {},
                "The JSON can be copied and pasted into the widgets properties in the desktop modeler"
            ),
            createElement("p", {},
                "Check out the chart options here: ",
                createElement("a", { href: "https://plot.ly/javascript/reference/", target: "_BLANK" },
                    "https://plot.ly/javascript/reference/"
                )
            )
        );
    }

    private renderAceEditor(value: string, onChange?: (value: string) => void, readOnly = false, mode: Mode = "json", overwriteValue?: string) {
        const markers = this.getMarker(value, overwriteValue);

        return createElement(AceEditor, {
            mode,
            value: `${value}\n`,
            readOnly,
            onChange,
            theme: "github",
            className: readOnly ? "ace-editor-read-only" : undefined,
            markers,
            maxLines: 1000, // crappy attempt to avoid a third scroll bar
            onValidate: this.onValidate,
            editorProps: { $blockScrolling: Infinity },
            setOptions: { showLineNumbers: false, highlightActiveLine: false, highlightGutterLine: true }
        });
    }

    private setAccordionProps(title: string, titleClass: string, show = true): AccordionProps {
        return { title, titleClass, show, collapsible: false };
    }

    private renderLayoutOptions() {
        return [
            createElement(Accordion,
                {
                    key: "layout",
                    ...this.setAccordionProps("Custom settings", "item-header")
                },
                this.renderAceEditor(`${this.props.layoutOptions}`, value => this.onUpdate("layout", value))
            ),
            createElement(Accordion,
                {
                    key: "modeler",
                    ...this.setAccordionProps("Settings from the Modeler", "item-header read-only")
                },
                this.renderAceEditor(this.props.modelerLayoutConfigs, undefined, true, "json", this.props.layoutOptions)
            )
        ];
    }

    private renderPieDataPanes() {
        if (this.props.pie && this.props.pie.dataOptions) {
            const { dataOptions, modelerDataConfigs } = this.props.pie;

            return [
                createElement(Accordion,
                    {
                        key: "data",
                        ...this.setAccordionProps("Custom settings", "item-header")
                    },
                    this.renderAceEditor(`${dataOptions}`, value => this.onUpdate("data", value))
                ),
                createElement(Accordion,
                    {
                        key: "modeler",
                        ...this.setAccordionProps("Settings from the Modeler", "item-header read-only")
                    },
                    this.renderAceEditor(modelerDataConfigs, undefined, true, "json", dataOptions)
                )
            ];
        }

        return null;
    }

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

    private onUpdate(source: string, value: string) {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => {
            if (this.isValid) {
                this.updateChart(source, value);
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
    }

    private getMarker(left: string, right?: string): Marker[] {
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

    private static removeTrailingNewLine(value: string): string {
        const splitValue = value.split("\n");
        if (splitValue[splitValue.length - 1] === "") {
            splitValue.pop();
        }

        return splitValue.join("\n");
    }
}
