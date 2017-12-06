import { createElement } from "react";
import { mount, shallow } from "enzyme";
import { ScatterHoverData } from "plotly.js";

import { Alert } from "../components/Alert";
import { BarChart, BarChartProps } from "../BarChart/components/BarChart";
import { ChartLoading } from "../components/ChartLoading";
import { Playground } from "../components/Playground";
import { PlotlyChart } from "../components/PlotlyChart";
import { preview } from "../BarChart/BarChart.webmodeler";

import { mockMendix } from "tests/mocks/Mendix";
import { Data } from "../utils/namespaces";
import SeriesProps = Data.SeriesProps;
import SeriesData = Data.SeriesData;

describe("BarChart", () => {
    const renderShallowBarChart = (props: BarChartProps) => shallow(createElement(BarChart, props));
    const renderFullBarChart = (props: BarChartProps) => mount(createElement(BarChart, props));
    let defaultProps: Partial<BarChartProps>;
    const sampleSeries: Partial<SeriesProps>[] = [
        {
            name: "Series 1",
            seriesOptions: "",
            tooltipForm: "myTooltipForm.xml"
        }
    ];
    const mockData: SeriesData[] = [
        {
            data: [ mockMendix.lib.MxObject() ] as any,
            series: sampleSeries[0] as SeriesProps
        }
    ];

    beforeEach(() => {
        defaultProps = {
            loading: false,
            data: mockData,
            devMode: "basic",
            width: 100,
            widthUnit: "percentage",
            height: 100,
            heightUnit: "pixels",
            layoutOptions: "{}",
            series: sampleSeries as SeriesProps[],
            orientation: "bar"
        };
        window.mendix = mockMendix as any;
    });

    it("with an alert message renders an alert", () => {
        defaultProps.alertMessage = "alert message";
        const chart = renderShallowBarChart(defaultProps as BarChartProps);

        expect(chart).toBeElement(
            createElement(Alert, { className: "widget-charts-bar-alert" }, defaultProps.alertMessage)
        );
    });

    it("that is loading data renders a loading indicator", () => {
        defaultProps.loading = true;
        const chart = renderShallowBarChart(defaultProps as BarChartProps);

        expect(chart).toBeElement(createElement(ChartLoading, { text: "Loading" }));
    });

    it("whose dev mode is developer renders the playground", () => {
        defaultProps.devMode = "developer";
        defaultProps.data = [];
        const chart = renderShallowBarChart(defaultProps as BarChartProps);

        expect(chart).toBeElement(
            createElement(Playground, {
                series: {
                    rawData: [],
                    chartData: [],
                    modelerSeriesConfigs: [],
                    traces: [],
                    onChange: jasmine.any(Function)
                },
                layoutOptions: "{}",
                modelerLayoutConfigs: JSON.stringify(BarChart.defaultLayoutConfigs(defaultProps as BarChartProps), null, 4)
            }, createElement(PlotlyChart,
                {
                    type: "bar",
                    style: { width: "100%", height: "100px" },
                    layout: BarChart.defaultLayoutConfigs(defaultProps as BarChartProps),
                    data: [],
                    config: { displayModeBar: false, doubleClick: false },
                    onClick: jasmine.any(Function),
                    onHover: jasmine.any(Function),
                    getTooltipNode: jasmine.any(Function)
                }
            ))
        );
    });

    it("with no alert message, isn't loading and whose dev mode isn't set to developer renders the chart correctly", () => {
        defaultProps.data = [];
        const chart = renderShallowBarChart(defaultProps as BarChartProps);

        expect(chart).toBeElement(
            createElement(PlotlyChart,
                {
                    type: "bar",
                    style: { width: "100%", height: "100px" },
                    layout: BarChart.defaultLayoutConfigs(defaultProps as BarChartProps),
                    data: [],
                    config: { displayModeBar: false, doubleClick: false },
                    onClick: jasmine.any(Function),
                    onHover: jasmine.any(Function),
                    getTooltipNode: jasmine.any(Function)
                }
            )
        );
    });

    it("updates the data & layout options when the props are updated", () => {
        const chart = renderShallowBarChart(defaultProps as BarChartProps);

        expect(chart.state().layoutOptions).toEqual("{}");
        expect(chart.state().data).toEqual(mockData);

        const layoutOptions = "{ \"title\": \"My Chart\" }";
        chart.setProps({ layoutOptions, data: undefined });

        expect(chart.state().layoutOptions).toEqual(layoutOptions);
        expect(chart.state().data).toBeUndefined();
    });

    it("renders the default data when no data has been provided", () => {
        defaultProps.data = undefined;
        defaultProps.defaultData = preview.getData(defaultProps as BarChartProps);
        const chart = renderShallowBarChart(defaultProps as BarChartProps);

        expect((chart.instance() as any).getData(defaultProps)).toBe(defaultProps.defaultData);
    });

    describe("event handler", () => {
        const plotlyEventData: ScatterHoverData<any> = {
            event: {} as any,
            points: [
                {
                    data: {
                        series: sampleSeries[0]
                    },
                    x: "X Value",
                    y: 20,
                    xaxis: {
                        d2p: () => 100,
                        l2p: () => 50,
                        _offset: 12
                    },
                    yaxis: {
                        d2p: () => 100,
                        l2p: () => 50,
                        _offset: 22
                    },
                    customdata: "customData"
                } as any
            ]
        };

        it("#onClick() calls the parent onClick handler", () => {
            defaultProps.onClick = jasmine.createSpy("onClick");
            const chart = renderShallowBarChart(defaultProps as BarChartProps);
            (chart.instance() as any).onClick(plotlyEventData);

            expect(defaultProps.onClick)
                .toHaveBeenCalledWith(plotlyEventData.points[0].data.series, plotlyEventData.points[0].customdata);
        });

        it("#onHover() calls the parent onClick handler", () => {
            defaultProps.onHover = jasmine.createSpy("onHover");
            const chart = renderFullBarChart(defaultProps as BarChartProps);
            const instance = chart.instance() as any;
            instance.onHover(plotlyEventData);

            expect(defaultProps.onHover)
                .toHaveBeenCalledWith(instance.tooltipNode, sampleSeries[0].tooltipForm, plotlyEventData.points[0].customdata); // tslint:disable-line max-line-length
        });
    });

    it("saves a reference of the tooltip node", () => {
        const tooltipNodeSpy = spyOn(BarChart.prototype, "getTooltipNodeRef" as any).and.callThrough();
        const chart = renderFullBarChart(defaultProps as BarChartProps);
        const instance: any = chart.instance();

        expect(tooltipNodeSpy).toHaveBeenCalled();
        expect(instance.tooltipNode).not.toBeUndefined();
    });
});
