import { Component, ReactElement, createElement } from "react";

import { Panel, PanelProps } from "./Panel";
import { Playground } from "./Playground";
import { Select, SelectOption, SelectProps } from "./Select";

import { Data } from "../utils/namespaces";
import { ScatterData } from "plotly.js";
import ScatterTrace = Data.ScatterTrace;
import SeriesData = Data.SeriesData;
import SeriesProps = Data.SeriesProps;

export interface SeriesPlaygroundProps {
    modelerSeriesConfigs?: string[];
    rawData?: SeriesData[];
    chartData?: Partial<ScatterData>[];
    traces?: PlaygroundSeriesTrace[];
    onChange?: (layout: string, data: SeriesData[]) => void;
    layoutOptions: string;
    modelerLayoutConfigs: string;
}
type PlaygroundSeriesTrace = ({ name: string } & ScatterTrace);
interface SeriesPlaygroundState {
    activeOption: string;
}

export class SeriesPlayground extends Component<SeriesPlaygroundProps, SeriesPlaygroundState> {
    state = { activeOption: "layout" };
    private newSeriesOptions: { layout: string, data: SeriesData[] } = {
        layout: this.props.layoutOptions || "{}",
        data: this.props.rawData || []
    };
    private timeoutId: number;
    private isValid: boolean;

    render() {
        return createElement(Playground, {},
            ...this.renderPanels(),
            this.renderPanelSwitcher(),
            this.props.children
        );
    }

    private renderPanels(): (ReactElement<PanelProps> | null)[] {
        if (this.state.activeOption === "layout") {
            return this.renderLayoutPanels();
        }

        return this.renderSeriesPanels(parseInt(this.state.activeOption, 10));
    }

    private renderLayoutPanels() {
        return [
            createElement(Panel,
                {
                    key: "layout",
                    heading: "Custom settings"
                },
                Playground.renderAceEditor({
                    value: `${this.props.layoutOptions}`,
                    onChange: value => this.onUpdate("layout", value),
                    onValidate: this.onValidate
                })
            ),
            createElement(Panel,
                {
                    key: "modeler",
                    heading: "Settings from the Modeler",
                    headingClass: "read-only"
                },
                Playground.renderAceEditor({
                    value: this.props.modelerLayoutConfigs,
                    readOnly: true,
                    overwriteValue: this.props.layoutOptions,
                    onValidate: this.onValidate
                })
            )
        ];
    }

    private renderSeriesPanels(activeIndex: number): (ReactElement<PanelProps> | null)[] {
        if (this.props.rawData) {
            const activeSeriesData = this.props.rawData[activeIndex];

            return [
                this.renderSeriesOptions(activeSeriesData.series, activeIndex),
                this.renderSeriesModelerConfig(activeIndex)
            ];
        }

        return [];
    }

    private renderPanelSwitcher(): ReactElement<SelectProps> | null {
        if (this.props.rawData) {
            return createElement(Select, {
                onChange: this.updateView,
                options: [
                    { name: "Layout", value: "layout", isDefaultSelected: true },
                    ...this.getSeriesOptions()
                ]
            });
        }

        return null;
    }

    private renderSeriesOptions(series: SeriesProps, index: number): ReactElement<PanelProps> {
        return createElement(Panel,
            {
                heading: "Custom settings",
                key: `options-${index}`
            },
            Playground.renderAceEditor({
                value: `${series.seriesOptions || "{\n\n}"}`,
                onChange: value => this.onUpdate(`${index}`, value),
                onValidate: this.onValidate
            })
        );
    }

    private renderSeriesModelerConfig(index: number): ReactElement<PanelProps> | null {
        if (this.props.modelerSeriesConfigs && this.props.rawData) {
            return createElement(Panel,
                {
                    heading: "Settings from the Modeler",
                    headingClass: "read-only",
                    key: `modeler-${index}`
                },
                Playground.renderAceEditor({
                    value: this.props.modelerSeriesConfigs[index] || "{\n\n}",
                    readOnly: true,
                    overwriteValue: this.props.rawData[index].series.seriesOptions,
                    onValidate: this.onValidate
                })
            );
        }

        return null;

    }

    private getSeriesOptions(): SelectOption[] {
        return this.props.rawData
            ? this.props.rawData.map(({ series }, index) =>
                ({ name: series.name, value: `${index}`, isDefaultSelected: false }))
            : [];
    }

    private updateChart = (source: string, value: string) => {
        const cleanValue = Playground.removeTrailingNewLine(value);
        if (source === "layout") {
            this.newSeriesOptions.layout = cleanValue;
        } else {
            (this.newSeriesOptions.data[ parseInt(source, 10) ] as SeriesData).series.seriesOptions = cleanValue;
        }
        if (this.props.onChange) {
            this.props.onChange(this.newSeriesOptions.layout, this.newSeriesOptions.data);
        }
    }

    private onValidate = (annotations: object[]) => {
        this.isValid = !annotations.length;
    }

    private onUpdate = (source: string, value: string) => {
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

    private updateView = (activeOption: string) => {
        this.setState({ activeOption });
    }
}
