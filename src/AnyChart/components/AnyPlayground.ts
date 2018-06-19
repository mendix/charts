import { Component, ReactElement, createElement } from "react";
import { Playground } from "../../components/Playground";
import { SidebarHeaderTools } from "../../components/SidebarHeaderTools";

import { Alert } from "../../components/Alert";
import AnyChart, { AnyChartProps } from "./AnyChart";
import { Panel, PanelProps } from "../../components/Panel";
import { Select } from "../../components/Select";

interface AnyChartPlaygroundState {
    staticData: string;
    staticLayout: string;
    attributeData: string;
    attributeLayout: string;
    activeOption: string;
    configurationOptions: string;
}

export class AnyChartPlayground extends Component<AnyChartProps, AnyChartPlaygroundState> {
    state: AnyChartPlaygroundState = {
        staticData: this.props.dataStatic,
        staticLayout: this.props.layoutStatic,
        attributeLayout: this.props.attributeLayout,
        attributeData: this.props.attributeData,
        configurationOptions: this.props.configurationOptions,
        activeOption: "layout"
    };
    private timeoutId?: number;
    private isValid = false;

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: `widget-charts-any-alert` }, this.props.alertMessage);
        }

        return createElement("div", {},
            createElement(Playground, {}, ...this.renderPanels(), this.renderHeaderTools()),
            this.createChart()
        );
    }

    private createChart() {
        return createElement(AnyChart, {
            ...this.props as AnyChartProps,
            layoutStatic: this.state.staticLayout,
            dataStatic: this.state.staticData,
            attributeLayout: this.state.attributeLayout,
            attributeData: this.state.attributeData,
            configurationOptions: this.state.configurationOptions
        });
    }

    componentWillReceiveProps(newProps: AnyChartProps) {
        this.setState({
            attributeData: newProps.attributeData,
            attributeLayout: newProps.attributeLayout,
            staticData: newProps.dataStatic,
            staticLayout: newProps.layoutStatic,
            configurationOptions: newProps.configurationOptions
        });
    }

    private renderPanels(): (ReactElement<PanelProps> | null)[] {
        if (this.state.activeOption === "layout") {
            return this.renderLayoutPanels();
        } else if (this.state.activeOption === "config") {
            return this.renderConfigPanels();
        }

        return this.renderDataPanes();
    }

    private renderLayoutPanels() {
        return [
            createElement(Panel,
                {
                    key: "layout",
                    heading: "Dynamic"
                },
                Playground.renderAceEditor({
                    value: this.formatJSONString(`${this.state.attributeLayout || "{\n\n}"}`),
                    onChange: value => this.onUpdate("layoutDynamic", value),
                    onValidate: this.onValidate
                })
            ),
            createElement(Panel,
                {
                    key: "modeler",
                    heading: "Static",
                    headingClass: "read-only"
                },
                Playground.renderAceEditor({
                    value: this.formatJSONString(this.state.staticLayout || "{\n\n}"),
                    onChange: value => this.onUpdate("layoutStatic", value),
                    overwriteValue: this.props.attributeLayout,
                    onValidate: this.onValidate
                })
            )
        ];
    }

    private renderDataPanes() {
        if (this.state.attributeData) {

            return [
                createElement(Panel,
                    {
                        key: "data",
                        heading: "Dynamic",
                        headingClass: "item-header"
                    },
                    Playground.renderAceEditor({
                        value: this.formatJSONString(`${this.state.attributeData || "{\n\n}"}`),
                        onChange: value => this.onUpdate("dataDynamic", value),
                        onValidate: this.onValidate
                    })
                ),
                createElement(Panel,
                    {
                        key: "modeler",
                        heading: "Static",
                        headingClass: "read-only"
                    },
                    Playground.renderAceEditor({
                        value: this.formatJSONString(this.state.staticData || "{\n\n}"),
                        onChange: value => this.onUpdate("dataStatic", value),
                        overwriteValue: this.state.attributeData,
                        onValidate: this.onValidate
                    })
                )
            ];
        }

        return [];
    }

    private renderConfigPanels() {
        if (this.state.attributeData) {

            return [
                createElement(Panel,
                    {
                        key: "config",
                        heading: "Configuration settings"
                    },
                    Playground.renderAceEditor({
                        value: this.formatJSONString(`${this.state.configurationOptions || "{\n\n}"}`),
                        onChange: value => this.onUpdate("config", value),
                        onValidate: this.onValidate
                    })
                ),
                createElement(Panel,
                    {
                        key: "default",
                        heading: "Default configuration",
                        headingClass: "read-only"
                    },
                    Playground.renderAceEditor({
                        value: `{ "displayModeBar": false, "doubleClick": false }`,
                        readOnly: true,
                        overwriteValue: this.state.configurationOptions,
                        onValidate: this.onValidate
                    })
                )
            ];
        }

        return [];
    }

    private renderHeaderTools(): ReactElement<any> {
        return createElement(SidebarHeaderTools, {},
            createElement(Select, {
                onChange: this.updateView,
                options: [
                    { name: "Layout", value: "layout", isDefaultSelected: true },
                    { name: "Data", value: "data", isDefaultSelected: false },
                    { name: "Configuration", value: "config", isDefaultSelected: false }
                ]
            })
        );
    }

    private onValidate = (annotations: object[]) => {
        this.isValid = !annotations.length;
    }

    private onUpdate = (source: string, value: string) => {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = window.setTimeout(() => {
            try {
                if (this.isValid) {
                    this.updateChart(source, JSON.stringify(JSON.parse(value), null, 2));
                } else {
                    this.updateChart(source, Playground.convertJSToJSON(value));
                }
            } catch (error) {
                this.isValid = false;
                console.error("An error occured while updating the playground chart", error); // tslint:disable-line
            }
        }, 1000);
    }

    private updateChart = (source: string, value: string) => {
        const cleanValue = Playground.removeTrailingNewLine(value);
        this.setState({
            attributeLayout: source === "layoutDynamic" ? cleanValue : this.state.attributeLayout,
            attributeData: source === "dataDynamic" ? cleanValue : this.state.attributeData,
            staticLayout: source === "layoutStatic" ? cleanValue : this.state.staticLayout,
            staticData: source === "dataStatic" ? cleanValue : this.state.staticData,
            configurationOptions: source === "config" ? cleanValue : this.state.configurationOptions
        });
    }

    private updateView = (activeOption: string) => {
        this.setState({ activeOption });
    }

    private formatJSONString(value: string) {
        return JSON.stringify(JSON.parse(value), null, 2);
    }
}
