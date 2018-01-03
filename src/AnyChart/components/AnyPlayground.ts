import { Component, ReactElement, createElement } from "react";
import { Playground } from "../../components/Playground";

import { AnyChart, AnyChartProps } from "./AnyChart";
import { Panel, PanelProps } from "../../components/Panel";
import { Select, SelectProps } from "../../components/Select";

interface AnyPlaygroundState {
    attributeData: string;
    attributeLayout: string;
    activeOption: string;
}

export class AnyPlayground extends Component<AnyChartProps, AnyPlaygroundState> {
    private timeoutId?: number;
    private isValid = false;

    constructor(props: AnyChartProps) {
        super(props);

        this.state = {
            attributeLayout: props.attributeLayout,
            attributeData: props.attributeData,
            activeOption: "layout"
        };
    }

    render() {
        return createElement("div", {},
            createElement(Playground, {}, ...this.renderPanels(), this.renderPanelSwitcher()),
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
                    value: `${this.state.attributeLayout}`,
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
                    value: this.props.layoutStatic,
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
                        value: `${this.state.attributeData}`,
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
                        value: this.props.dataStatic,
                        readOnly: true,
                        overwriteValue: this.state.attributeData,
                        onValidate: this.onValidate
                    })
                )
            ];
        }

        return [];
    }

    private renderPanelSwitcher(): ReactElement<SelectProps> {
        return createElement(Select, {
            onChange: this.updateView,
            options: [
                { name: "Layout", value: "layout", isDefaultSelected: true },
                { name: "Data", value: "data", isDefaultSelected: false }
            ]
        });
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
}
