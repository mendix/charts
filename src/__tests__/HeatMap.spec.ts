import { createElement } from "react";
import { mount, shallow } from "enzyme";
import { mockMendix } from "../../tests/mocks/Mendix";

import { Alert } from "../components/Alert";
import { ChartLoading } from "../components/ChartLoading";
import { HeatMap, HeatMapProps } from "../HeatMap/components/HeatMap";
import "../PieChart/components/PiePlayground";
import { PlotlyChart } from "../components/PlotlyChart";
import { HeatMapData, ScatterHoverData } from "plotly.js";
import { Container } from "../utils/namespaces";

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
            layoutOptions: "{}",
            scaleColors: []
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
        defaultProps.data = getData(defaultProps as HeatMapProps);
        const renderPlaygroundSpy = spyOn(HeatMap.prototype, "renderPlayground" as any).and.callThrough();
        defaultProps.devMode = "developer";
        const chart = renderShallowChart(defaultProps as HeatMapProps);

        window.setTimeout(() => {
            expect(renderPlaygroundSpy).toHaveBeenCalled();

            done();
        }, 500);
    });

    it("whose dev mode is basic does not render the playground", (done) => {
        defaultProps.data = getData(defaultProps as HeatMapProps);
        const renderPlaygroundSpy = spyOn(HeatMap.prototype, "renderPlayground" as any).and.callThrough();
        defaultProps.devMode = "basic";
        const chart = renderShallowChart(defaultProps as HeatMapProps);

        window.setTimeout(() => {
            expect(renderPlaygroundSpy).not.toHaveBeenCalled();

            done();
        }, 500);
    });

    it("whose dev mode is advanced does not render the playground", (done) => {
        defaultProps.data = getData(defaultProps as HeatMapProps);
        const renderPlaygroundSpy = spyOn(HeatMap.prototype, "renderPlayground" as any).and.callThrough();
        defaultProps.devMode = "advanced";
        const chart = renderShallowChart(defaultProps as HeatMapProps);

        window.setTimeout(() => {
            expect(renderPlaygroundSpy).not.toHaveBeenCalled();

            done();
        }, 500);
    });
    // tslint:disable-next-line max-line-length
    it("with no alert message, isn't loading and whose dev mode isn't set to developer renders the chart correctly", () => {
        defaultProps.devMode = "basic";
        defaultProps.data = getData(defaultProps as HeatMapProps);
        const chart = renderShallowChart(defaultProps as HeatMapProps);

        expect(chart).toBeElement(
            createElement(PlotlyChart,
                {
                    type: "heatmap",
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

    it("saves a reference of the tooltip node", () => {
        defaultProps.data = getData(defaultProps as HeatMapProps);
        const chart = renderFullChart(defaultProps as HeatMapProps);
        const instance: any = chart.instance();

        expect(instance.tooltipNode).toBeDefined();
    });

    it("with the devMode basic should not merge the modeler JSON layout options", () => {
        defaultProps.data = getData(defaultProps as HeatMapProps);
        defaultProps.layoutOptions = "{ \"title\": \"My HeatMap\" }";
        defaultProps.showValues = false;
        defaultProps.devMode = "basic";
        const chart = renderShallowChart(defaultProps as HeatMapProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getLayoutOptions(defaultProps)).toEqual({
            ...HeatMap.getDefaultLayoutOptions(defaultProps as HeatMapProps),
            annotations: undefined
        });
    });

    it("with the devMode advanced should merge the modeler JSON layout options", () => {
        defaultProps.data = getData(defaultProps as HeatMapProps);
        defaultProps.layoutOptions = "{ \"title\": \"My HeatMap\" }";
        defaultProps.showValues = false;
        defaultProps.devMode = "advanced";
        const chart = renderShallowChart(defaultProps as HeatMapProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getLayoutOptions(defaultProps)).toEqual({
            ...HeatMap.getDefaultLayoutOptions(defaultProps as HeatMapProps),
            annotations: undefined,
            title: "My HeatMap"
        });
    });

    it("with the devMode developer should merge the modeler JSON layout options", () => {
        defaultProps.data = getData(defaultProps as HeatMapProps);
        defaultProps.layoutOptions = "{ \"title\": \"My HeatMap\" }";
        defaultProps.showValues = false;
        defaultProps.devMode = "developer";
        const chart = renderShallowChart(defaultProps as HeatMapProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getLayoutOptions(defaultProps)).toEqual({
            ...HeatMap.getDefaultLayoutOptions(defaultProps as HeatMapProps),
            annotations: undefined,
            title: "My HeatMap"
        });
    });

    it("with the devMode basic should not merge the modeler JSON data options", () => {
        defaultProps.data = getData(defaultProps as HeatMapProps);
        defaultProps.dataOptions = "{ \"showscale\": true }";
        defaultProps.devMode = "basic";
        const chart = renderShallowChart(defaultProps as HeatMapProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getData(defaultProps)).toEqual([
            {
                ...HeatMap.getDefaultDataOptions(defaultProps as HeatMapProps),
                x: defaultProps.data.x,
                y: defaultProps.data.y,
                z: defaultProps.data.z,
                text: defaultProps.data.z.map((row, i) => row.map((item, j) => `${item}`)),
                colorscale: [ [ 0, "#17347B" ], [ 0.5, "#48B0F7" ], [ 1, "#76CA02" ] ]
            }
        ]);
    });

    it("with the devMode advanced should merge the modeler JSON data options", () => {
        defaultProps.data = getData(defaultProps as HeatMapProps);
        defaultProps.dataOptions = "{ \"showscale\": true }";
        defaultProps.devMode = "advanced";
        const chart = renderShallowChart(defaultProps as HeatMapProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getData(defaultProps)).toEqual([
            {
                ...HeatMap.getDefaultDataOptions(defaultProps as HeatMapProps),
                x: defaultProps.data.x,
                y: defaultProps.data.y,
                z: defaultProps.data.z,
                text: defaultProps.data.z.map((row, i) => row.map((item, j) => `${item}`)),
                colorscale: [ [ 0, "#17347B" ], [ 0.5, "#48B0F7" ], [ 1, "#76CA02" ] ],
                showscale: true
            }
        ]);
    });

    it("with the devMode developer should not merge the modeler JSON data options", () => {
        defaultProps.data = getData(defaultProps as HeatMapProps);
        defaultProps.dataOptions = "{ \"showscale\": true }";
        defaultProps.devMode = "developer";
        const chart = renderShallowChart(defaultProps as HeatMapProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getData(defaultProps)).toEqual([
            {
                ...HeatMap.getDefaultDataOptions(defaultProps as HeatMapProps),
                x: defaultProps.data.x,
                y: defaultProps.data.y,
                z: defaultProps.data.z,
                text: defaultProps.data.z.map((row, i) => row.map((item, j) => `${item}`)),
                colorscale: [ [ 0, "#17347B" ], [ 0.5, "#48B0F7" ], [ 1, "#76CA02" ] ],
                showscale: true
            }
        ]);
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
            defaultProps.data = getData(defaultProps as HeatMapProps);
            defaultProps.onClick = jasmine.createSpy("onClick");
            const chart = renderShallowChart(defaultProps as HeatMapProps);
            (chart.instance() as any).onClick(plotlyEventData);

            expect(defaultProps.onClick).toHaveBeenCalled();
        });

        it("#onHover() calls the parent onClick handler", () => {
            defaultProps.data = getData(defaultProps as HeatMapProps);
            defaultProps.onHover = jasmine.createSpy("onHover");
            const chart = renderFullChart(defaultProps as HeatMapProps);
            const instance = chart.instance() as any;
            instance.onHover(plotlyEventData);

            expect(defaultProps.onHover).toHaveBeenCalled();
        });
    });
});

const getData = (props: Container.HeatMapContainerProps): HeatMapData => {
    return {
        x: [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" ],
        y: [ "Morning", "Afternoon", "Evening" ],
        z: [ [ 1, 20, 30, 50, 1 ], [ 20, 1, 60, 80, 30 ], [ 30, 60, 1, -10, 20 ] ],
        colorscale: processColorScale(props.scaleColors),
        showscale: props.showScale,
        type: "heatmap"
    };
};

const processColorScale = (scaleColors: Container.ScaleColors[]): (string | number)[][] => {
    return scaleColors.length > 1
        ? scaleColors.map(colors => [ Math.abs(colors.valuePercentage / 100), colors.colour ])
        : [ [ 0, "#17347B" ], [ 0.5, "#48B0F7" ], [ 1, "#76CA02" ] ];
};
