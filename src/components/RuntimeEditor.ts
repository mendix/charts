import { Component, createElement } from "react";

import { Accordion } from "./Accordion";
import { MendixButton } from "./MendixButton";
import AceEditor, { Mode } from "react-ace";
import { Sidebar } from "./Sidebar";
import { TabContainer } from "./TabContainer";
import { TabHeader } from "./TabHeader";
import { TabPane } from "./TabPane";
import { TabTool } from "./TabTool";

import "brace";
import { ScatterTrace, SeriesData } from "../utils/data";
import deepMerge from "deepmerge";
import { PieTraces } from "../PieChart/components/PieChart";
import { PieData } from "../../typings/plotly.js";
import { ScatterData } from "plotly.js";

import "brace/mode/json";
import "brace/mode/javascript";
import "brace/theme/github";

interface RuntimeEditorProps {
    supportSeries: boolean;
    layoutOptions: string;
    dataOptions?: string;
    modelerConfigs: string;
    rawData?: SeriesData[];
    chartData: ScatterData[] | PieData[];
    traces: RuntimeSeriesTrace[] | PieTraces;
    onChange?: (layout: string, data: SeriesData[] | string) => void;
}

type RuntimeSeriesTrace = ({ name: string } & ScatterTrace);

export class RuntimeEditor extends Component<RuntimeEditorProps, { showEditor: boolean }> {
    private updatedOptions: { layout: string, data: SeriesData[] | string };
    private timeoutId: number;
    private isValid: boolean;

    constructor(props: RuntimeEditorProps) {
        super(props);

        this.updateOption = this.updateOption.bind(this);
        this.updateChart = this.updateChart.bind(this);
        this.onValidate = this.onValidate.bind(this);
        this.toggleShowEditor = this.toggleShowEditor.bind(this);

        this.state = { showEditor: false };
        this.updatedOptions = {
            layout: props.layoutOptions || "{}",
            data: props.supportSeries ? props.rawData || [] : props.dataOptions || "{}"
        };
    }

    render() {
        return createElement("div", { className: "widget-charts-advanced" },
            createElement(Sidebar, { open: this.state.showEditor }, this.renderTabs()),
            createElement("div", { className: "widget-charts-advanced-toggle" },
                createElement(MendixButton, {
                    onClick: this.toggleShowEditor,
                    className: "pull-right"
                }, "Toggle Editor")
            ),
            this.props.children
        );
    }

    private renderTabs() {
        return createElement(TabContainer, { tabHeaderClass: "control-sidebar-tabs", justified: true },
            createElement(TabHeader, { title: "Advanced" }),
            createElement(TabHeader, { title: "Modeler" }),
            createElement(TabHeader, { title: "Data" }),
            createElement(TabHeader, { title: "Full" }),
            createElement(TabTool, { className: "pull-right remove", onClick: this.toggleShowEditor },
                createElement("em", { className: "glyphicon glyphicon-chevron-right" })
            ),
            createElement(TabPane, {}, this.renderAdvancedOptions()),
            createElement(TabPane, {}, this.renderAceEditor(this.props.modelerConfigs, undefined, true)),
            createElement(TabPane, {}, this.renderData()),
            createElement(TabPane, {}, this.renderFullConfig())
        );
    }

    private renderAceEditor(value: string, onChange?: (value: string) => void, readOnly = false, mode: Mode = "json") {
        return createElement(AceEditor, {
            mode,
            value,
            readOnly,
            onChange,
            theme: "github",
            className: readOnly ? "ace-editor-read-only" : undefined,
            maxLines: 1000, // crappy attempt to avoid a third scroll bar
            onValidate: this.onValidate,
            editorProps: { $blockScrolling: Infinity }
        });
    }

    private renderAdvancedOptions() {
        const layoutOptions = createElement(Accordion, {
                key: "layout",
                title: "Layout options",
                titleClass: "item-header",
                show: true
            },
            this.renderAceEditor(this.props.layoutOptions, value => this.updateOption("layout", value))
        );
        if (this.props.supportSeries && this.props.rawData) {
            const seriesOptions = this.props.rawData.map(({ series }, index) =>
                createElement(Accordion,
                    {
                        key: `series-${index}`,
                        title: series.name,
                        titleClass: "item-header",
                        show: true
                    },
                    this.renderAceEditor(series.seriesOptions || "{\n\n}", value =>
                        this.updateOption(`series-${index}`, value)
                    )
                )
            );

            return [ layoutOptions ].concat(seriesOptions);
        }
        if (!this.props.supportSeries && this.props.dataOptions) {
            const dataOptions = createElement(Accordion, {
                    key: "data",
                    title: "Data options",
                    titleClass: "item-header",
                    show: true
                },
                this.renderAceEditor(this.props.dataOptions, value => this.updateOption("data", value))
            );

            return [ layoutOptions ].concat(dataOptions);
        }

        return layoutOptions;
    }

    private renderData() {
        if (this.props.supportSeries && Array.isArray(this.props.traces)) {
            return (this.props.traces as RuntimeSeriesTrace[]).map((trace, index) =>
                createElement(Accordion, {
                        key: `series-${index}`,
                        title: trace.name,
                        titleClass: "item-header",
                        show: true
                    },
                    this.renderAceEditor(JSON.stringify({ x: trace.x, y: trace.y }, null, 4), undefined, true)
                )
            );
        }
        if (!this.props.supportSeries && this.props.traces) {
            return createElement("div", {},
                this.renderAceEditor(JSON.stringify(this.props.traces as PieTraces, null, 4), undefined, true)
            );
        }

        return null;
    }

    private renderFullConfig() {
        const mergedLayoutOptions = deepMerge.all([
            JSON.parse(this.props.modelerConfigs),
            JSON.parse(this.props.layoutOptions)
        ]);
        let value = `var layoutOptions = ${JSON.stringify(mergedLayoutOptions, null, 4)};\n\n`;
        if (this.props.supportSeries) {
            value = value + (this.props.chartData as ScatterData[]).map(RuntimeEditor.getSeriesCode).join("\n\n");
        } else if (!this.props.supportSeries) {
            const mergedDataOptions = deepMerge.all([
                JSON.parse(this.props.dataOptions || "{}"),
                (this.props.chartData as PieData[])[0]
            ]);
            value = value + `var data = [${JSON.stringify(mergedDataOptions, null, 4)}]`;
        }

        return createElement(AceEditor, {
            mode: "javascript",
            readOnly: true,
            value,
            theme: "github",
            maxLines: 1000, // crappy attempt to avoid a third scroll bar
            className: "ace-editor-read-only",
            editorProps: { $blockScrolling: Infinity }
        });
    }

    private toggleShowEditor() {
        this.setState({ showEditor: !this.state.showEditor });
    }

    private updateOption(source: string, value: string) {
        if (source === "layout") {
            this.updatedOptions.layout = value;
        }
        if (source.indexOf("series") > -1) {
            const index = source.split("-")[1];
            (this.updatedOptions.data[ parseInt(index, 10) ] as SeriesData).series.seriesOptions = value;
        } else if (source.indexOf("data") > -1) {
            this.updatedOptions.data = value;
        }
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(this.updateChart, 1000);
    }

    private onValidate(annotations: object[]) {
        this.isValid = !annotations.length;
    }

    private updateChart() {
        if (this.isValid && this.props.onChange) {
            this.props.onChange(this.updatedOptions.layout, this.updatedOptions.data);
        }
    }

    private static getSeriesCode(series: ScatterData, index: number) {
        return `var series${index} = ${JSON.stringify(RuntimeEditor.cleanSeries(series), null, 4)};`;
    }

    private static cleanSeries(series: ScatterData): Partial<ScatterData> {
        return { ...series, mxObjects: undefined, series: undefined };
    }
}
