import { Component, ReactElement, createElement } from "react";
import { Playground } from "../../components/Playground";
import { SidebarHeaderTools } from "../../components/SidebarHeaderTools";
import { MendixButton } from "../../components/MendixButton";

import { Alert } from "../../components/Alert";
import { AnyChart, AnyChartProps } from "./AnyChart";
import { Panel, PanelProps } from "../../components/Panel";
import { Select, SelectProps } from "../../components/Select";

interface AnyPlaygroundState {
    attributeData: string;
    attributeLayout: string;
    activeOption: string;
}

export class AnyPlayground extends Component<AnyChartProps, AnyPlaygroundState> {
    state: AnyPlaygroundState = {
        attributeLayout: this.props.attributeLayout,
        attributeData: this.props.attributeData,
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
            layoutStatic: this.props.layoutStatic,
            dataStatic: this.props.dataStatic,
            attributeLayout: this.state.attributeLayout,
            attributeData: this.state.attributeData
        });
    }

    componentWillReceiveProps(newProps: AnyChartProps) {
        this.setState({
            attributeData: newProps.attributeData,
            attributeLayout: newProps.attributeLayout
        });
    }

    private renderPanels(): (ReactElement<PanelProps> | null)[] {
        if (this.state.activeOption === "layout") {
            return this.renderLayoutPanels();
        }

        return this.renderPieDataPanes();
    }

    private renderLayoutPanels() {
        return [
            createElement(Panel,
                {
                    key: "layout",
                    heading: "Custom settings"
                },
                Playground.renderAceEditor({
                    value: `${this.state.attributeLayout || "{\n\n}"}`,
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
                    value: this.props.layoutStatic || "{\n\n}",
                    readOnly: true,
                    overwriteValue: this.props.attributeLayout,
                    onValidate: this.onValidate
                })
            )
        ];
    }

    private renderPieDataPanes() {
        if (this.state.attributeData) {

            return [
                createElement(Panel,
                    {
                        key: "data",
                        heading: "Custom settings",
                        headingClass: "item-header"
                    },
                    Playground.renderAceEditor({
                        value: `${this.state.attributeData || "{\n\n}"}`,
                        onChange: value => this.onUpdate("data", value),
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
                        value: this.props.dataStatic || "{\n\n}",
                        readOnly: true,
                        overwriteValue: this.state.attributeData,
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
                    { name: "Data", value: "data", isDefaultSelected: false }
                ]
            })
            // createElement(MendixButton, {
            //     className: "any-chart-plotly-copy",
            //     onClick: this.updateChartFromCopy
            // }, "Copy from Plotly")
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
                if (this.isValid && JSON.parse(value)) {
                    this.updateChart(source, value);
                }
            } catch (error) {
                this.isValid = false;
                console.error("An error occured while updating the playground chart", error); // tslint:disable-line
            }
        }, 1000);
    }

    private updateChart = (source: string, value: string) => {
        const cleanValue = Playground.removeTrailingNewLine(value);
        if (source === "layout") {
            this.setState({ attributeLayout: cleanValue });
        } else {
            this.setState({ attributeData: cleanValue });
        }
    }

    private updateView = (activeOption: string) => {
        this.setState({ activeOption });
    }

    private updateChartFromCopy() {
        const data = [];
        const layout = {};
        const value = window.prompt("Copy and paste the Plotly JavaScript example code here") as string;
        if (value !== null) {
            const newValue = (value.indexOf(".newPlot") !== -1) ? value.substring(0, value.indexOf("Plotly.new")) : value;
            // tslint:disable-next-line
            var results = eval('(function() {' + newValue + '; return {data:data, layout:layout};}())');
            if (results.data.length > 0) {
                this.updateChart("data", JSON.stringify(results.data, null, 2));
            }
            if (JSON.stringify(results.layout) !== JSON.stringify({}, null, 2)) {
                this.updateChart("layout", JSON.stringify(results.layout, null, 2));
            }
        }
    }
}
