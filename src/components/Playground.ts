import { Component, SyntheticEvent, createElement } from "react";
import AceEditor, { Marker, Mode } from "react-ace";
import * as classNames from "classnames";
import { Operation, compare } from "fast-json-patch";
import * as jsonMap from "json-source-map";

import { InfoTooltip } from "./InfoTooltip";
import { MendixButton } from "./MendixButton";
import { Panel } from "./Panel";
import { PlaygroundContentSwitcher } from "./PlaygroundContentSwitcher";
import { Sidebar } from "./Sidebar";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarContent } from "./SidebarContent";

import { ScatterTrace, SeriesData, SeriesProps } from "../utils/data";
import { PieTraces } from "../PieChart/components/PieChart";
import { PlaygroundInfo } from "./PlaygroundInfo";
import { PieData, ScatterData } from "plotly.js";

import "brace";
import "brace/mode/json";
import "brace/theme/github";
import "../ui/Playground.scss";

export interface PlaygroundProps {
    pie?: PiePlaygroundOptions;
    series?: SeriesPlaygroundOptions;
    layoutOptions: string;
    modelerLayoutConfigs: string;
}

interface PlaygroundState {
    showEditor: boolean;
    showTooltip: boolean;
    activeOption: string;
}

interface PiePlaygroundOptions {
    dataOptions: string;
    modelerDataConfigs: string;
    chartData: Partial<PieData>[];
    traces: PieTraces;
    onChange?: (layout: string, data: string) => void;
}

export interface SeriesPlaygroundOptions {
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
                createElement(SidebarHeader, { className: "row" },
                    createElement(PlaygroundContentSwitcher, { onChange: this.updateView, series: this.props.series })
                ),
                createElement(SidebarContent, {},
                    createElement(InfoTooltip, { show: this.state.showTooltip, onClick: this.toggleTooltip },
                        createElement(PlaygroundInfo)
                    ),
                    this.renderSidebarContent()
                )
            ),
            createElement("div", { className: "widget-charts-playground-toggle" },
                createElement(MendixButton, { onClick: this.toggleShowEditor }, "Toggle Editor")
            ),
            this.props.children
        );
    }

    private renderSidebarContent() {
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
        return createElement(Panel,
            {
                heading: "Custom settings",
                key: `options-${index}`
            },
            this.renderAceEditor(`${series.seriesOptions || "{\n\n}"}`, value =>
                this.onUpdate(`series-${index}`, value)
            )
        );
    }

    private renderSeriesModelerConfig(index: number) {
        if (this.props.series && this.props.series.modelerSeriesConfigs && this.props.series.rawData) {
            return createElement(Panel,
                {
                    heading: "Settings from the Modeler",
                    headingClass: "read-only",
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

    private renderLayoutOptions() {
        return [
            createElement(Panel,
                {
                    key: "layout",
                    heading: "Custom settings"
                },
                this.renderAceEditor(`${this.props.layoutOptions}`, value => this.onUpdate("layout", value))
            ),
            createElement(Panel,
                {
                    key: "modeler",
                    heading: "Settings from the Modeler",
                    headingClass: "read-only"
                },
                this.renderAceEditor(this.props.modelerLayoutConfigs, undefined, true, "json", this.props.layoutOptions)
            )
        ];
    }

    private renderPieDataPanes() {
        if (this.props.pie && this.props.pie.dataOptions) {
            const { dataOptions, modelerDataConfigs } = this.props.pie;

            return [
                createElement(Panel,
                    {
                        key: "data",
                        heading: "Custom settings",
                        headingClass: "item-header"
                    },
                    this.renderAceEditor(`${dataOptions}`, value => this.onUpdate("data", value))
                ),
                createElement(Panel,
                    {
                        key: "modeler",
                        heading: "Settings from the Modeler",
                        headingClass: "read-only"
                    },
                    this.renderAceEditor(modelerDataConfigs, undefined, true, "json", dataOptions)
                )
            ];
        }

        return null;
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
