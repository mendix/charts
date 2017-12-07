import { shallow } from "enzyme";
import { SyntheticEvent, createElement } from "react";

import { InfoTooltip } from "../components/InfoTooltip";
import { mockMendix } from "../../tests/mocks/Mendix";
import { MendixButton } from "../components/MendixButton";
import { Panel } from "../components/Panel";
import { Playground, PlaygroundProps } from "../components/Playground";
import { PlaygroundContentSwitcher } from "../components/PlaygroundContentSwitcher";
import { PlaygroundInfo } from "../components/PlaygroundInfo";
import AceEditor from "react-ace";
import { Sidebar } from "../components/Sidebar";
import { SidebarContent } from "../components/SidebarContent";
import { SidebarHeader } from "../components/SidebarHeader";

describe("Playground", () => {
    it("should render the structure correctly", () => {
        const playground = shallow(createElement(Playground, {
            modelerLayoutConfigs: "{}",
            layoutOptions: "{}"
        }));

        expect(playground.type()).toBe("div");
        expect(playground).toHaveClass("widget-charts-playground");
        expect(playground.children().length).toBe(2);
        expect(playground.childAt(0).type()).toBe(Sidebar);

        const sidebar = playground.find(Sidebar);
        expect(sidebar.props().open).toBe(false);
        expect(typeof sidebar.props().onClick).toBe("function");
        expect(typeof sidebar.props().onBlur).toBe("function");
        expect(typeof sidebar.props().onClose).toBe("function");
        expect(sidebar.children().length).toBe(2);
        expect(sidebar.childAt(0).type()).toBe(SidebarHeader);
        expect(sidebar.childAt(1).type()).toBe(SidebarContent as any);

        const sidebarHeader = sidebar.find(SidebarHeader);
        expect(sidebarHeader).toBeElement(
            createElement(SidebarHeader, { className: "row" },
                createElement(PlaygroundContentSwitcher, { onChange: jasmine.any(Function) })
            )
        );

        const sidebarContent = sidebar.find(SidebarContent);
        expect(sidebarContent.children().length).toBe(3);
        expect(sidebarContent.childAt(0).type()).toBe(InfoTooltip);
        expect(sidebarContent.childAt(1).type()).toBe(Panel);
        expect(sidebarContent.childAt(2).type()).toBe(Panel);

        const infoTooltip = sidebarContent.find(InfoTooltip);
        expect(infoTooltip.props().show).toBe(false);
        expect(typeof infoTooltip.props().onClick).toBe("function");
        expect(infoTooltip.children().length).toBe(1);
        expect(infoTooltip.childAt(0).type()).toBe(PlaygroundInfo as any);

        const playgroundToggle = playground.childAt(1);
        expect(playgroundToggle).toBeElement(
            createElement("div", { className: "widget-charts-playground-toggle" },
                createElement(MendixButton, { onClick: jasmine.any(Function) }, "Toggle Editor")
            )
        );
    });

    it("should not show the editor initially", () => {
        const playground = shallow(createElement(Playground, {
            modelerLayoutConfigs: "{}",
            layoutOptions: "{}"
        }));

        expect(playground.state().showEditor).toBe(false);
    });

    it("should not show the tooltip initially", () => {
        const playground = shallow(createElement(Playground, {
            modelerLayoutConfigs: "{}",
            layoutOptions: "{}"
        }));

        expect(playground.state().showTooltip).toBe(false);
    });

    it("should render the layout options in the sidebar when the active option is layout", () => {
        const playground = shallow(createElement(Playground, {
            modelerLayoutConfigs: "{}",
            layoutOptions: "{}"
        }));
        const sidebar = playground.find(Sidebar);
        const panels = sidebar.find(Panel);

        expect(panels.length).toBe(2);

        panels.forEach(panel => {
            expect(panel.children().length).toBe(1);
            expect(panel.childAt(0).type()).toBe(AceEditor);
        });

        expect(panels.first()).toBeElement(
            createElement(Panel,
                { heading: "Custom settings" },
                createElement(AceEditor, {
                    mode: "json",
                    value: `{}\n`,
                    readOnly: false,
                    onChange: jasmine.any(Function),
                    theme: "github",
                    markers: [],
                    maxLines: 1000,
                    onValidate: jasmine.any(Function),
                    editorProps: { $blockScrolling: Infinity },
                    setOptions: { showLineNumbers: false, highlightActiveLine: false, highlightGutterLine: true }
                })
            )
        );
        expect(panels.at(1)).toBeElement(
            createElement(Panel,
                { heading: "Settings from the Modeler", headingClass: "read-only" },
                createElement(AceEditor, {
                    mode: "json",
                    value: `{}\n`,
                    readOnly: true,
                    theme: "github",
                    className: "ace-editor-read-only",
                    markers: [],
                    maxLines: 1000,
                    onValidate: jasmine.any(Function),
                    editorProps: { $blockScrolling: Infinity },
                    setOptions: { showLineNumbers: false, highlightActiveLine: false, highlightGutterLine: true }
                })
            )
        );
    });

    describe("with pie properties and active option set to data", () => {
        let defaultProps: PlaygroundProps;

        beforeEach(() => {
            defaultProps = {
                modelerLayoutConfigs: "{}",
                layoutOptions: "{}",
                pie: {
                    dataOptions: "{}",
                    modelerDataConfigs: "{}",
                    chartData: [ {
                        hole: 0.5,
                        type: "pie"
                    } ],
                    traces: {
                        labels: [],
                        values: []
                    }
                }
            };
        });

        it("should render the pie content in the sidebar", () => {
            const playground = shallow(createElement(Playground, defaultProps));
            playground.setState({ activeOption: "data" });
            const sidebar = playground.find(Sidebar);
            const panels = sidebar.find(Panel);

            expect(panels.first()).toBeElement(
                createElement(Panel,
                    { heading: "Custom settings", headingClass: "item-header" },
                    createElement(AceEditor, {
                        mode: "json",
                        value: `{}\n`,
                        readOnly: false,
                        onChange: jasmine.any(Function),
                        theme: "github",
                        markers: [],
                        maxLines: 1000,
                        onValidate: jasmine.any(Function),
                        editorProps: { $blockScrolling: Infinity },
                        setOptions: { showLineNumbers: false, highlightActiveLine: false, highlightGutterLine: true }
                    })
                )
            );

            expect(panels.at(1)).toBeElement(
                createElement(Panel,
                    { heading: "Settings from the Modeler", headingClass: "read-only" },
                    createElement(AceEditor, {
                        mode: "json",
                        value: `{}\n`,
                        readOnly: true,
                        theme: "github",
                        className: "ace-editor-read-only",
                        markers: [],
                        maxLines: 1000,
                        onValidate: jasmine.any(Function),
                        editorProps: { $blockScrolling: Infinity },
                        setOptions: { showLineNumbers: false, highlightActiveLine: false, highlightGutterLine: true }
                    })
                )
            );
        });

        it("and no dataOptions should not render any pie content", () => {
            (defaultProps.pie as any).dataOptions = "";
            const playground = shallow(createElement(Playground, defaultProps));
            playground.setState({ activeOption: "data" });

            expect(playground.find(Panel).length).toBe(0);
        });
    });

    describe("with activeOption neither layout nor data", () => {
        describe("but with series properties", () => {
            let defaultProps: PlaygroundProps;

            beforeEach(() => {
                defaultProps = {
                    modelerLayoutConfigs: "{}",
                    layoutOptions: "{}",
                    series: {
                        rawData: [
                            {
                                data: [ mockMendix.lib.MxObject() ] as any,
                                series: {
                                    name: "Series 1",
                                    seriesOptions: "{}",
                                    tooltipForm: "myTooltipForm.xml"
                                }
                            } as any
                        ]
                    }
                };
            });

            it("should render the series content", () => {
                const playground = shallow(createElement(Playground, defaultProps));
                playground.setState({ activeOption: 0 });
                const sidebar = playground.find(Sidebar);
                const panels = sidebar.find(Panel);

                expect(panels.first()).toBeElement(
                    createElement(Panel,
                        { heading: "Custom settings" },
                        createElement(AceEditor, {
                            mode: "json",
                            value: `{}\n`,
                            readOnly: false,
                            onChange: jasmine.any(Function),
                            theme: "github",
                            markers: [],
                            maxLines: 1000,
                            onValidate: jasmine.any(Function),
                            editorProps: { $blockScrolling: Infinity },
                            setOptions: { showLineNumbers: false, highlightActiveLine: false, highlightGutterLine: true }
                        })
                    )
                );
            });

            describe("and no JSON series options", () => {
                it("should render an ace editor with the default JSON content", () => {
                    defaultProps = {
                        modelerLayoutConfigs: "{}",
                        layoutOptions: "{}",
                        series: {
                            rawData: [
                                {
                                    data: [ mockMendix.lib.MxObject() ] as any,
                                    series: {
                                        name: "Series 1",
                                        seriesOptions: "",
                                        tooltipForm: "myTooltipForm.xml"
                                    }
                                } as any
                            ]
                        }
                    };
                    const playground = shallow(createElement(Playground, defaultProps));
                    playground.setState({ activeOption: 0 });
                    const sidebar = playground.find(Sidebar);
                    const panels = sidebar.find(Panel);
                    const aceEditor = panels.first().find(AceEditor);

                    expect(aceEditor.props().value).toBe("{\n\n}\n");
                });
            });
        });

        describe("and no series properties", () => {
            it("should render no sidebar content", () => {
                const playground = shallow(createElement(Playground, {
                    modelerLayoutConfigs: "{}",
                    layoutOptions: "{}"
                }));
                playground.setState({ activeOption: 0 });

                expect(playground.find(Panel).length).toBe(0);
            });
        });
    });

    describe("function", () => {
        it("#updateView() ", () => {
            const setStateSpy = spyOn(Playground.prototype, "setState");
            const playground = shallow(createElement(Playground, {
                modelerLayoutConfigs: "{}",
                layoutOptions: "{}"
            }));
            const instance: any = playground.instance();
            const mockEvent = {
                currentTarget: { value: "data" }
            } as SyntheticEvent<HTMLSelectElement>;
            instance.updateView(mockEvent);

            expect(setStateSpy).toHaveBeenCalledWith({ activeOption: "data" });
        });
    });
});
