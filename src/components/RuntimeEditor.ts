import { Component, createElement } from "react";

import { Data, LineChartProps } from "src/LineChart/components/LineChart";
import { SeriesProps } from "src/LineChart/components/LineChartContainer";
import { MendixButton } from "./MendixButton";
import AceEditor from "react-ace";
import { TabContainer } from "./TabContainer";
import { TabHeader } from "./TabHeader";
import { TabPane } from "./TabPane";
import { TabTool } from "./TabTool";

import "brace";
import deepMerge from "deepmerge";
import { Datum } from "plotly.js";

import "brace/mode/json";
import "brace/mode/javascript";
import "brace/theme/github";

interface RuntimeEditorProps extends LineChartProps {
    onChange?: (layout: string, data: Data[]) => void;
}

type Mode = "json" | "javascript";

export class RuntimeEditor extends Component<RuntimeEditorProps, { showEditor: boolean }> {
    private updatedOptions: { layout: string, data: Data[] };
    private timeoutId: number;
    private isValid: boolean;

    constructor(props: RuntimeEditorProps) {
        super(props);

        this.updateOption = this.updateOption.bind(this);
        this.updateChart = this.updateChart.bind(this);
        this.setValidationState = this.setValidationState.bind(this);
        this.toggleShowEditor = this.toggleShowEditor.bind(this);
        this.state = { showEditor: false };
        this.updatedOptions = {
            layout: props.layoutOptions || "{}",
            data: props.data || []
        };
    }

    render() {
        if (this.state.showEditor) {
            return createElement("div", { className: "widget-charts-advanced" },
                createElement(TabContainer, { style: "tabs" },
                    createElement(TabHeader, { title: "Chart preview" }),
                    createElement(TabHeader, { title: "Modeler configuration" }),
                    createElement(TabHeader, { title: "Advanced options" }),
                    createElement(TabHeader, { title: "Data" }),
                    createElement(TabHeader, { title: "Full config" }),
                    createElement(TabTool, { className: "pull-right remove", onClick: this.toggleShowEditor },
                        createElement("em", { className: "glyphicon glyphicon-remove" })
                    ),
                    createElement(TabPane, {}, this.props.children),
                    createElement(TabPane, {}, this.renderAceEditor(this.getXMLConfigs(), undefined, true)),
                    createElement(TabPane, {}, this.renderAdvancedOptions(this.props.data || [])),
                    createElement(TabPane, {}, this.renderData(this.props.data || [])),
                    createElement(TabPane, {}, this.renderFullConfig())
                )
            );
        }
        return createElement("div", { className: "widget-charts-advanced" },
            createElement(MendixButton, { onClick: this.toggleShowEditor }, "Open Editor"),
            this.props.children
        );
    }

    componentWillReceiveProps(newProps: RuntimeEditorProps) {
        this.updatedOptions = {
            layout: newProps.layoutOptions || "{}",
            data: newProps.data || []
        };
    }

    private renderAceEditor(value: string, onChange?: (value: string) => void, readOnly = false, mode: Mode = "json") {
        return createElement(AceEditor, {
            mode,
            value,
            readOnly,
            onChange,
            theme: "github",
            className: readOnly ? "ace-editor-read-only" : undefined,
            maxLines: 15,
            onValidate: this.setValidationState,
            editorProps: { $blockScrolling: true }
        });
    }

    private renderAdvancedOptions(chartData: Data[]) {
        const layoutOptions = createElement("div", { key: "layout" },
            createElement("h4", {}, "Layout options"),
            this.renderAceEditor(this.props.layoutOptions, value => this.updateOption("layout", value))
        );
        const seriesOptions = chartData.map(({ series }, index) =>
            createElement("div", { key: `series-${index}` },
                createElement("h4", {}, series.name),
                this.renderAceEditor(series.seriesOptions, value => this.updateOption(`series-${index}`, value))
            )
        );

        return [ layoutOptions ].concat(seriesOptions);
    }

    private renderData(chartData: Data[]) {
        return chartData.map(({ data, series }, index) => {
            const values = this.getSeriesData({ data, series });

            return createElement("div", { key: `series-${index}` },
                createElement("h4", {}, series.name),
                this.renderAceEditor(
                    JSON.stringify(values, null, 4),
                    value => this.updateOption(`series_sample_data-${index}`, value),
                    !!data
                )
            );
        });
    }

    private renderFullConfig() {
        const combinedLayoutOptions = deepMerge.all([
            JSON.parse(this.getXMLConfigs()),
            JSON.parse(this.updatedOptions.layout)
        ]);
        const layoutCode = `var layoutOptions = ${JSON.stringify(combinedLayoutOptions, null, 4)};\n\n`;
        const seriesCode = this.props.data && this.props.data
            .map((data, index) => this.getSeriesCode(data, index));

        return createElement(AceEditor, {
            mode: "javascript",
            readOnly: true,
            value: layoutCode + (seriesCode ? seriesCode.join("\n\n") : ""),
            theme: "github",
            className: "ace-editor-read-only",
            editorProps: { $blockScrolling: true }
        });
    }

    private toggleShowEditor() {
        this.setState({ showEditor: !this.state.showEditor });
    }

    private getXMLConfigs() {
        return JSON.stringify({
            autosize: true,
            hovermode: "closest",
            showlegend: this.props.showLegend,
            xaxis: {
                title: this.props.xAxisLabel,
                showgrid: this.props.grid === "vertical" || this.props.grid === "both",
                fixedrange: true
            },
            yaxis: {
                title: this.props.yAxisLabel,
                showgrid: this.props.grid === "horizontal" || this.props.grid === "both",
                fixedrange: true
            }
        }, null, 4);
    }

    private getDefaultSeriesOptions(series: SeriesProps) {
        return {
            connectgaps: true,
            hoveron: "points",
            hoverinfo: this.props.tooltipForm ? "text" : undefined,
            line: {
                color: series.lineColor,
                shape: series.lineStyle
            },
            mode: series.mode ? series.mode.replace("X", "+") as Mode : "lines",
            name: series.name,
            type: "scatter",
            fill: this.props.fill ? "tonexty" : "none"
        };
    }

    private getSeriesData({ data, series }: Data) {
        if (data) {
            return {
                x: data.map(value => value.get(series.xValueAttribute) as Datum),
                y: data.map(value => parseInt(value.get(series.yValueAttribute) as string, 10))
            };
        }
        if (series.sampleData && series.sampleData.trim()) {
            return JSON.parse(series.sampleData.trim());
        }
        if (this.props.defaultData) {
            return {
                x: this.props.defaultData.map(scatterData => scatterData.x),
                y: this.props.defaultData.map(scatterData => scatterData.y)
            };
        }

        return {};
    }

    private getSeriesCode({ data, series }: Data, index: number) {
        const defaultOptions = this.getDefaultSeriesOptions(series);
        const combinedSeriesOptions = deepMerge.all([
            defaultOptions,
            series.seriesOptions ? JSON.parse(series.seriesOptions) : {},
            this.getSeriesData({ data, series })
        ]);

        return `var series${index} = ${JSON.stringify(combinedSeriesOptions, null, 4)};`;
    }

    private updateOption(source: string, value: string) {
        if (source === "layout") {
            this.updatedOptions.layout = value;
        }
        if (source.indexOf("series") > -1) {
            const index = source.split("-")[1];
            if (source.indexOf("sample_data") > -1) {
                this.updatedOptions.data[ parseInt(index, 10) ].series.sampleData = value;
            } else {
                this.updatedOptions.data[ parseInt(index, 10) ].series.seriesOptions = value;
            }
        }
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(this.updateChart, 1000);
    }

    private setValidationState(annotations: object[]) {
        this.isValid = !annotations.length;
    }

    private updateChart() {
        if (this.isValid && this.props.onChange) {
            this.props.onChange(this.updatedOptions.layout, this.updatedOptions.data);
        }
    }
}
