import { createElement } from "react";
import { mount, shallow } from "enzyme";
import { mockMendix } from "../../tests/mocks/Mendix";

import { Alert } from "../components/Alert";
import { ChartLoading } from "../components/ChartLoading";
import { HeatMap, HeatMapProps } from "../HeatMap/components/HeatMap";
import { preview } from "../HeatMap/HeatMap.webmodeler";
import "../PieChart/components/PiePlayground";
import { PlotlyChart } from "../components/PlotlyChart";
import { ScatterHoverData } from "plotly.js";

describe("HeatMap", () => {
    const renderShallowChart = (props: HeatMapProps) => shallow(createElement(HeatMap, props));
    const renderFullChart = (props: HeatMapProps) => mount(createElement(HeatMap, props));
    let defaultProps: Partial<HeatMapProps>;

    beforeEach(() => {
        defaultProps = {
            loading: false,
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
        const chart = renderShallowChart(defaultProps as HeatMapProps);

        expect(chart).toBeElement(
            createElement(Alert, { className: "widget-heat-map-alert" }, defaultProps.alertMessage)
        );
    });

    it("that is loading data renders a loading indicator", () => {
        defaultProps.loading = true;
        const chart = renderShallowChart(defaultProps as HeatMapProps);

        expect(chart).toBeElement(createElement(ChartLoading, { text: "Loading" }));
    });

    it("whose dev mode is developer renders the playground", (done) => {
        defaultProps.data = preview.getData(defaultProps as HeatMapProps);
        const renderPlaygroundSpy = spyOn(HeatMap.prototype, "renderPlayground" as any).and.callThrough();
        const chart = renderShallowChart(defaultProps as HeatMapProps);
        chart.setProps({ devMode: "developer" });

        window.setTimeout(() => {
            expect(renderPlaygroundSpy).toHaveBeenCalled();

            done();
        }, 1000);
    });

    xit("with no alert message, isn't loading and whose dev mode isn't set to developer renders the chart correctly", () => {
        defaultProps.data = preview.getData(defaultProps as HeatMapProps);
        const chart = renderShallowChart(defaultProps as HeatMapProps);

        expect(chart).toBeElement(
            createElement(PlotlyChart,
                {
                    type: "full",
                    style: { width: "100%", height: "100px" },
                    layout: jasmine.any(Object) as any,
                    data: jasmine.any(Object) as any,
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
            points: [
                {
                    xaxis: {
                        l2p: () => 1,
                        d2p: () => 2,
                        _offset: 5
                    },
                    yaxis: {
                        l2p: () => 1,
                        d2p: () => 2,
                        _offset: 5
                    },
                    x: 3,
                    y: 6
                } as any
            ]
        };

        it("#onClick() calls the parent onClick handler", () => {
            defaultProps.onClick = jasmine.createSpy("onClick");
            const chart = renderShallowChart(defaultProps as HeatMapProps);
            (chart.instance() as any).onClick(plotlyEventData);

            expect(defaultProps.onClick).toHaveBeenCalled();
        });

        it("#onHover() calls the parent onClick handler", () => {
            defaultProps.onHover = jasmine.createSpy("onHover");
            const chart = renderFullChart(defaultProps as HeatMapProps);
            const instance = chart.instance() as any;
            instance.onHover(plotlyEventData);

            expect(defaultProps.onHover).toHaveBeenCalled();
        });
    });
});
