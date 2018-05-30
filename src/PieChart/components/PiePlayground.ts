import { Component, ReactElement, createElement } from "react";

import { Playground } from "../../components/Playground";
import { Panel, PanelProps } from "../../components/Panel";
import { Select } from "../../components/Select";
import { SidebarHeaderTools } from "../../components/SidebarHeaderTools";

export interface PiePlaygroundProps {
    dataOptions: string;
    modelerDataConfigs: string;
    layoutOptions: string;
    configurationOptionsDefault?: string;
    configurationOptions?: string;
    modelerLayoutConfigs: string;
    onChange?: (layout: string, data: string, config: string) => void;
}
interface PiePlaygroundState {
    activeOption: string;
}

export class PiePlayground extends Component<PiePlaygroundProps, PiePlaygroundState> {
    state = { activeOption: "layout" };
    private newPieOptions: { layout: string, data: string, config: string } = {
        layout: this.props.layoutOptions || "{}",
        config: this.props.configurationOptions || "{}",
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
        if (this.state.activeOption === "config") {
            return this.renderConfigPanels();
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

    private renderConfigPanels() {
        return [
            createElement(Panel,
                {
                    key: "config",
                    heading: "Custom settings"
                },
                Playground.renderAceEditor({
                    value: `${this.props.configurationOptions}`,
                    onChange: value => this.onUpdate("config", value),
                    onValidate: this.onValidate
                })
            ),
            createElement(Panel,
                {
                    key: "default",
                    heading: "Settings from the Modeler",
                    headingClass: "read-only"
                },
                Playground.renderAceEditor({
                    value: this.props.configurationOptionsDefault || "{}",
                    readOnly: true,
                    overwriteValue: this.props.configurationOptions,
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

    private renderPanelSwitcher(): ReactElement<any> {
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
            }
        }, 1000);
    }

    private updateChart = (source: string, value: string) => {
        const cleanValue = Playground.removeTrailingNewLine(value);
        if (source === "layout") {
            this.newPieOptions.layout = cleanValue;
         } else if (source === "config") {
            this.newPieOptions.config = cleanValue;
        } else {
            this.newPieOptions.data = cleanValue;
        }
        if (this.props.onChange) {
            this.props.onChange(this.newPieOptions.layout, this.newPieOptions.data, this.newPieOptions.config);
        }
    }

    private updateView = (activeOption: string) => {
        this.setState({ activeOption });
    }
}
