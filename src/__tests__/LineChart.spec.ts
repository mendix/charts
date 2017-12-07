import { createElement } from "react";
import { mount, shallow } from "enzyme";
import { mockMendix } from "../../tests/mocks/Mendix";

import { Alert } from "../components/Alert";
import { ChartLoading } from "../components/ChartLoading";
import { LineChart, LineChartProps } from "../LineChart/components/LineChart";
import { preview } from "../LineChart/LineChart.webmodeler";
import { Data } from "../utils/namespaces";
import { Playground } from "../components/Playground";
import { PlotlyChart } from "../components/PlotlyChart";
import { ScatterHoverData } from "plotly.js";
import LineSeriesProps = Data.LineSeriesProps;
import SeriesData = Data.SeriesData;

describe("LineChart", () => {
    const renderShallowChart = (props: LineChartProps) => shallow(createElement(LineChart, props));
    const renderFullChart = (props: LineChartProps) => mount(createElement(LineChart, props));
    let defaultProps: Partial<LineChartProps>;
    const sampleSeries: Partial<LineSeriesProps>[] = [
        {
            name: "Series 1",
            seriesOptions: "",
            tooltipForm: "myTooltipForm.xml"
        }
    ];
    const mockData: SeriesData<LineSeriesProps>[] = [
        {
            data: [ mockMendix.lib.MxObject() ] as any,
            series: sampleSeries[0] as LineSeriesProps
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
            series: sampleSeries as LineSeriesProps[]
        };
        window.mendix = mockMendix as any;
    });

    it("with an alert message renders an alert", () => {
        defaultProps.alertMessage = "alert message";
        const chart = renderShallowChart(defaultProps as LineChartProps);

        expect(chart).toBeElement(
            createElement(Alert, { className: "widget-charts-line-alert" }, defaultProps.alertMessage)
        );
    });

    it("that is loading data renders a loading indicator", () => {
        defaultProps.loading = true;
        const chart = renderShallowChart(defaultProps as LineChartProps);

        expect(chart).toBeElement(createElement(ChartLoading, { text: "Loading" }));
    });

    xit("whose dev mode is developer renders the playground", () => {
        defaultProps.devMode = "developer";
        defaultProps.data = [];
        const chart = renderShallowChart(defaultProps as LineChartProps);

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
                modelerLayoutConfigs: JSON.stringify(LineChart.defaultLayoutConfigs(defaultProps as LineChartProps), null, 4)
            }, createElement(PlotlyChart,
                {
                    type: "line",
                    style: { width: "100%", height: "100px" },
                    layout: LineChart.defaultLayoutConfigs(defaultProps as LineChartProps),
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
        const chart = renderShallowChart(defaultProps as LineChartProps);

        expect(chart).toBeElement(
            createElement(PlotlyChart,
                {
                    type: "line",
                    style: { width: "100%", height: "100px" },
                    layout: LineChart.defaultLayoutConfigs(defaultProps as LineChartProps),
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
        const chart = renderShallowChart(defaultProps as LineChartProps);

        expect(chart.state().layoutOptions).toEqual("{}");
        expect(chart.state().data).toEqual(mockData);

        const layoutOptions = "{ \"title\": \"My Chart\" }";
        chart.setProps({ layoutOptions, data: undefined });

        expect(chart.state().layoutOptions).toEqual(layoutOptions);
        expect(chart.state().data).toBeUndefined();
    });

    it("renders the default data when no data has been provided", () => {
        defaultProps.data = undefined;
        defaultProps.defaultData = preview.getData(defaultProps as LineChartProps);
        const chart = renderShallowChart(defaultProps as LineChartProps);

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
            const chart = renderShallowChart(defaultProps as LineChartProps);
            (chart.instance() as any).onClick(plotlyEventData);

            expect(defaultProps.onClick).toHaveBeenCalled();
        });

        it("#onHover() calls the parent onClick handler", () => {
            defaultProps.onHover = jasmine.createSpy("onHover");
            const chart = renderFullChart(defaultProps as LineChartProps);
            const instance = chart.instance() as any;
            instance.onHover(plotlyEventData);

            expect(defaultProps.onHover)
                .toHaveBeenCalledWith(instance.tooltipNode, sampleSeries[0].tooltipForm, plotlyEventData.points[0].customdata); // tslint:disable-line max-line-length
        });
    });

    it("saves a reference of the tooltip node", () => {
        const tooltipNodeSpy = spyOn(LineChart.prototype, "getTooltipNodeRef" as any).and.callThrough();
        const chart = renderFullChart(defaultProps as LineChartProps);
        const instance: any = chart.instance();

        expect(tooltipNodeSpy).toHaveBeenCalled();
        expect(instance.tooltipNode).not.toBeUndefined();
    });
});
