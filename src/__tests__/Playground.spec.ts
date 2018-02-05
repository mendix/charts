import { shallow } from "enzyme";
import { createElement } from "react";

import { InfoTooltip } from "../components/InfoTooltip";
import { MendixButton } from "../components/MendixButton";
import { Panel } from "../components/Panel";
import { Playground } from "../components/Playground";
import { PlaygroundInfo } from "../components/PlaygroundInfo";
import { PlotlyChart } from "../components/PlotlyChart";
import { Select } from "../components/Select";
import { Sidebar } from "../components/Sidebar";
import { SidebarContent } from "../components/SidebarContent";
import { SidebarHeader } from "../components/SidebarHeader";

describe("Playground", () => {
    it("should render the structure correctly", () => {
        const playground = shallow(createElement(Playground));

        expect(playground).toBeElement(
            createElement("div", { className: "widget-charts-playground" },
                createElement(Sidebar,
                    {
                        open: false,
                        onBlur: jasmine.any(Function),
                        onClick: jasmine.any(Function),
                        onClose: jasmine.any(Function)
                    },
                    createElement(SidebarHeader, { className: "row" }),
                    createElement(SidebarContent, {},
                        createElement(InfoTooltip, { show: false, onClick: jasmine.any(Function) },
                            createElement(PlaygroundInfo)
                        )
                    )
                ),
                createElement("div", { className: "widget-charts-playground-toggle" },
                    createElement(MendixButton, { onClick: jasmine.any(Function) }, "Toggle Editor")
                )
            )
        );
    });

    it("should not show the editor initially", () => {
        const playground = shallow(createElement(Playground));

        expect(playground.state().showEditor).toBe(false);
    });

    it("should not show the tooltip initially", () => {
        const playground = shallow(createElement(Playground, {}));

        expect(playground.state().showTooltip).toBe(false);
    });

    it("should render the sidebar header with the playground options", () => {
        const playground = shallow(createElement(Playground, {}, createElement(Select)));
        const sidebarHeader = playground.find(SidebarHeader);
        const select = sidebarHeader.find(Select);

        expect(select.length).toBe(1);
    });

    it("should render the sidebar content panels", () => {
        const playground = shallow(
            createElement(Playground, {},
                createElement(Panel),
                createElement(Panel)
            )
        );
        const sidebarContent = playground.find(SidebarContent);
        const panel = sidebarContent.find(Panel);

        expect(panel.length).toBe(2);
    });

    it("should render the chart", () => {
        const playground = shallow(createElement(Playground, {}, createElement(PlotlyChart)));
        const chart = playground.find(PlotlyChart);

        expect(chart.length).toBe(1);
    });

    describe("with panels, a chart and a content switcher", () => {
        it("renders all in their respective positions", () => {
            const playground = shallow(
                createElement(Playground, {},
                    createElement(Panel),
                    createElement(Panel),
                    createElement(PlotlyChart),
                    createElement(Select)
                )
            );

            const sidebarHeader = playground.find(SidebarHeader);
            const select = sidebarHeader.find(Select);
            expect(select.length).toBe(1);

            const sidebarContent = playground.find(SidebarContent);
            const panel = sidebarContent.find(Panel);
            expect(panel.length).toBe(2);

            const chart = playground.find(PlotlyChart);
            expect(chart.length).toBe(1);
        });
    });
});
