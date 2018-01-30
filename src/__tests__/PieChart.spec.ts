import { createElement } from "react";
import { mount, shallow } from "enzyme";
import { mockMendix } from "../../tests/mocks/Mendix";

import { Alert } from "../components/Alert";
import { ChartLoading } from "../components/ChartLoading";
import { PieChart, PieChartProps } from "../PieChart/components/PieChart";
import { Playground } from "../components/Playground";
import { PlotlyChart } from "../components/PlotlyChart";
import { ScatterHoverData } from "plotly.js";

describe("PieChart", () => {
    const renderShallowChart = (props: PieChartProps) => shallow(createElement(PieChart, props));
    const renderFullChart = (props: PieChartProps) => mount(createElement(PieChart, props));
    let defaultProps: Partial<PieChartProps>;

    beforeEach(() => {
        defaultProps = {
            loading: false,
            chartType: "pie",
            data: [ mockMendix.lib.MxObject() ] as any,
            devMode: "basic",
            width: 100,
            widthUnit: "percentage",
            height: 100,
            heightUnit: "pixels",
            layoutOptions: "{}"
        };
        window.mendix = mockMendix as any;
    });

    it("with an alert message renders an alert", () => {
        defaultProps.alertMessage = "alert message";
        const chart = renderShallowChart(defaultProps as PieChartProps);

        expect(chart).toBeElement(
            createElement(Alert, { className: "widget-charts-pie-alert" }, defaultProps.alertMessage)
        );
    });

    it("that is loading data renders a loading indicator", () => {
        defaultProps.loading = true;
        const chart = renderShallowChart(defaultProps as PieChartProps);

        expect(chart).toBeElement(createElement(ChartLoading, { text: "Loading" }));
    });

    xit("whose dev mode is developer renders the playground", () => {
        defaultProps.devMode = "developer";
        defaultProps.data = [];
        const chart = renderShallowChart(defaultProps as PieChartProps);
        const data = [
            {
                hole: 0,
                hoverinfo: "label",
                labels: [],
                marker: { colors: [ "#2CA1DD", "#76CA02", "#F99B1D", "#B765D1" ] },
                type: "pie",
                values: [],
                sort: false
            }
        ] as any;

        expect(chart).toBeElement(
            createElement(Playground, {},
                createElement(PlotlyChart, {
                    type: "pie",
                    style: { width: "100%", height: "100px" },
                    layout: PieChart.getDefaultLayoutOptions(defaultProps as PieChartProps),
                    data,
                    config: { displayModeBar: false, doubleClick: false },
                    onClick: jasmine.any(Function),
                    onHover: jasmine.any(Function),
                    getTooltipNode: jasmine.any(Function)
                })
            )
        );
    });

    it("with no alert message, isn't loading and whose dev mode isn't set to developer renders the chart correctly", () => {
        defaultProps.data = [];
        const chart = renderShallowChart(defaultProps as PieChartProps);

        expect(chart).toBeElement(
            createElement(PlotlyChart,
                {
                    type: "pie",
                    style: { width: "100%", height: "100px" },
                    layout: PieChart.getDefaultLayoutOptions(defaultProps as PieChartProps),
                    data: [
                        {
                            hole: 0,
                            hoverinfo: "label",
                            labels: [],
                            marker: { colors: [ "#2CA1DD", "#76CA02", "#F99B1D", "#B765D1" ] },
                            type: "pie",
                            values: [],
                            sort: false
                        }
                    ],
                    config: { displayModeBar: false, doubleClick: false },
                    onClick: jasmine.any(Function),
                    onHover: jasmine.any(Function),
                    getTooltipNode: jasmine.any(Function)
                }
            )
        );
    });

    describe("event handler", () => {
        const plotlyEventData: ScatterHoverData<any> = {
            event: { clientY: 300, clientX: 400 } as any,
            points: [ { pointNumber: "customData" } as any ]
        };

        it("#onClick() calls the parent onClick handler", () => {
            defaultProps.onClick = jasmine.createSpy("onClick");
            const chart = renderShallowChart(defaultProps as PieChartProps);
            (chart.instance() as any).onClick(plotlyEventData);

            expect(defaultProps.onClick).toHaveBeenCalled();
        });

        it("#onHover() calls the parent onClick handler", () => {
            defaultProps.onHover = jasmine.createSpy("onHover");
            const chart = renderFullChart(defaultProps as PieChartProps);
            const instance = chart.instance() as any;
            instance.onHover(plotlyEventData);

            expect(defaultProps.onHover).toHaveBeenCalled();
        });
    });
});
