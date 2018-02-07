import { Component, ReactElement, createElement } from "react";

import { Playground } from "../../components/Playground";
import { Panel, PanelProps } from "../../components/Panel";
import { Select, SelectProps } from "../../components/Select";

export interface PiePlaygroundProps {
    dataOptions: string;
    modelerDataConfigs: string;
    layoutOptions: string;
    modelerLayoutConfigs: string;
    onChange?: (layout: string, data: string) => void;
}
interface PiePlaygroundState {
    activeOption: string;
}

export class PiePlayground extends Component<PiePlaygroundProps, PiePlaygroundState> {
    state = { activeOption: "layout" };
    private newPieOptions: { layout: string, data: string } = {
        layout: this.props.layoutOptions || "{}",
        data: this.props.dataOptions || "{\n\n}"
    };
    private timeoutId?: number;
    private isValid = false;

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

    private renderPieDataPanes() {
        if (this.props.dataOptions) {
            const { dataOptions, modelerDataConfigs } = this.props;

            return [
                createElement(Panel,
                    {
                        key: "data",
                        heading: "Custom settings",
                        headingClass: "item-header"
                    },
                    Playground.renderAceEditor({
                        value: `${dataOptions}`,
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
                        value: modelerDataConfigs,
                        readOnly: true,
                        overwriteValue: dataOptions,
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
            this.newPieOptions.layout = cleanValue;
        } else {
            this.newPieOptions.data = cleanValue;
        }
        if (this.props.onChange) {
            this.props.onChange(this.newPieOptions.layout, this.newPieOptions.data);
        }
    }

    private updateView = (activeOption: string) => {
        this.setState({ activeOption });
    }
}
