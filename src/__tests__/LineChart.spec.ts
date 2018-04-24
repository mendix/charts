import { createElement } from "react";
import { mount, shallow } from "enzyme";
import { mockMendix } from "../../tests/mocks/Mendix";

import { Alert } from "../components/Alert";
import { ChartLoading } from "../components/ChartLoading";
import { LineChart, LineChartProps } from "../LineChart/components/LineChart";
import { Container, Data } from "../utils/namespaces";
import "../components/SeriesPlayground";
import { PlotlyChart } from "../components/PlotlyChart";

import { getRandomNumbers } from "../utils/data";
import * as style from "../utils/style";
import deepMerge from "deepmerge";
import { ScatterData, ScatterHoverData } from "plotly.js";
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
            devMode: "basic",
            width: 100,
            widthUnit: "percentage",
            height: 100,
            heightUnit: "pixels",
            layoutOptions: "{}",
            configurationOptions: "{}",
            series: sampleSeries as LineSeriesProps[],
            themeConfigs: { layout: {}, configuration: {}, data: {} }
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

        expect(chart).toBeElement(createElement(ChartLoading));
    });

    it("whose dev mode is developer renders the playground", (done) => {
        defaultProps.devMode = "developer";
        const renderPlaygroundSpy = spyOn(LineChart.prototype, "renderPlayground" as any).and.callThrough();
        const chart = renderShallowChart(defaultProps as LineChartProps);

        window.setTimeout(() => {
            expect(renderPlaygroundSpy).toHaveBeenCalled();

            done();
        }, 500);
    });

    it("whose dev mode is advanced does not render the playground", (done) => {
        defaultProps.devMode = "advanced";
        const renderPlaygroundSpy = spyOn(LineChart.prototype, "renderPlayground" as any).and.callThrough();
        const chart = renderShallowChart(defaultProps as LineChartProps);

        window.setTimeout(() => {
            expect(renderPlaygroundSpy).not.toHaveBeenCalled();

            done();
        }, 500);
    });

    it("whose dev mode is basic does not render the playground", (done) => {
        defaultProps.devMode = "basic";
        const renderPlaygroundSpy = spyOn(LineChart.prototype, "renderPlayground" as any).and.callThrough();
        const chart = renderShallowChart(defaultProps as LineChartProps);

        window.setTimeout(() => {
            expect(renderPlaygroundSpy).not.toHaveBeenCalled();

            done();
        }, 500);
    });

    it("with no alert message, isn't loading and whose dev mode isn't set to developer renders the chart correctly", () => {
        const chart = renderShallowChart(defaultProps as LineChartProps);

        expect(chart).toBeElement(
            createElement(PlotlyChart,
                {
                    type: "line",
                    style: { width: "100%", height: "100px" },
                    layout: jasmine.any(Object) as any,
                    data: [],
                    config: { displayModeBar: false, doubleClick: false },
                    onClick: jasmine.any(Function),
                    onHover: jasmine.any(Function),
                    onRestyle: jasmine.any(Function),
                    getTooltipNode: jasmine.any(Function),
                    onRender: jasmine.any(Function),
                    onResize: jasmine.any(Function)
                }
            )
        );
    });

    it("updates the state with the new props when the props are changed", () => {
        const chart = renderShallowChart(defaultProps as LineChartProps);
        defaultProps.layoutOptions = "{}";
        defaultProps.seriesOptions = [ "{}" ];
        defaultProps.series = [
            {
                name: "Series 2",
                seriesOptions: "",
                tooltipForm: "myTooltipForm.xml"
            }
        ] as LineSeriesProps[];
        defaultProps.scatterData = [
            {
                x: [ 1, 2, 3 ],
                y: [ 2, 4, 6 ]
            }
        ] as ScatterData[];
        chart.setProps(defaultProps as LineChartProps);

        expect(chart.state()).toEqual({
            layoutOptions: defaultProps.layoutOptions,
            series: defaultProps.series,
            seriesOptions: defaultProps.seriesOptions,
            scatterData: defaultProps.scatterData,
            configurationOptions: defaultProps.configurationOptions,
            playgroundLoaded: false,
            hiddenTraces: []
        });
    });

    it("with the devMode basic should not merge the modeler JSON layout options", () => {
        defaultProps.layoutOptions = "{ 'title': 'My Title' }";
        defaultProps.devMode = "basic";
        const chart = renderShallowChart(defaultProps as LineChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getLayoutOptions(defaultProps)).toEqual(
            LineChart.defaultLayoutConfigs(defaultProps as LineChartProps)
        );
    });

    it("with the devMode developer should merge the modeler JSON layout options", () => {
        defaultProps.layoutOptions = "{ \"title\": \"My Title\" }";
        defaultProps.devMode = "developer";
        const chart = renderShallowChart(defaultProps as LineChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getLayoutOptions(defaultProps)).toEqual({
            ...LineChart.defaultLayoutConfigs(defaultProps as LineChartProps),
            title: "My Title"
        });
    });

    it("with the devMode advanced should merge the modeler JSON layout options", () => {
        defaultProps.layoutOptions = "{ \"title\": \"My Title\" }";
        defaultProps.devMode = "advanced";
        const chart = renderShallowChart(defaultProps as LineChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getLayoutOptions(defaultProps)).toEqual({
            ...LineChart.defaultLayoutConfigs(defaultProps as LineChartProps),
            title: "My Title"
        });
    });

    it("with the devMode basic should not merge the modeler JSON series options", () => {
        defaultProps.scatterData = getData(defaultProps as LineChartProps);
        defaultProps.seriesOptions = [ "{ \"mode\": \"lines\" }" ];
        defaultProps.devMode = "basic";
        const chart = renderShallowChart(defaultProps as LineChartProps);
        const chartInstance: any = chart.instance();
        chartInstance.chartNode = document.createElement("div");

        expect(chartInstance.getData(defaultProps)).toEqual([
            { ...defaultProps.scatterData[0], visible: true, customdata: undefined }
        ]);
    });

    it("with the devMode advanced should merge the modeler JSON series options", () => {
        defaultProps.scatterData = getData(defaultProps as LineChartProps);
        defaultProps.seriesOptions = [ "{ \"mode\": \"markers\" }" ];
        defaultProps.devMode = "advanced";
        const chart = renderShallowChart(defaultProps as LineChartProps);
        const chartInstance: any = chart.instance();
        chartInstance.chartNode = document.createElement("div");

        expect(chartInstance.getData(defaultProps)).toEqual([
            { ...defaultProps.scatterData[0], mode: "markers", visible: true, customdata: undefined }
        ]);
    });

    it("with the devMode developer should merge the modeler JSON series options", () => {
        defaultProps.scatterData = getData(defaultProps as LineChartProps);
        defaultProps.seriesOptions = [ "{ \"mode\": \"lines\" }" ];
        defaultProps.devMode = "developer";
        const chart = renderShallowChart(defaultProps as LineChartProps);
        const chartInstance: any = chart.instance();
        chartInstance.chartNode = document.createElement("div");

        expect(chartInstance.getData(defaultProps)).toEqual([
            { ...defaultProps.scatterData[0], mode: "lines", visible: true, customdata: undefined }
        ]);
    });

    it("that is configured as stacked generates the stacked chart data", () => {
        const stackedAreaSpy = spyOn(LineChart, "getStackedArea" as any).and.callThrough();
        defaultProps.scatterData = getData(defaultProps as LineChartProps);
        const chart = renderFullChart(defaultProps as LineChartProps);
        const chartInstance: any = chart.instance();
        chartInstance.chartNode = document.createElement("div");
        chart.setProps({ area: "stacked" });

        expect(stackedAreaSpy).toHaveBeenCalled();
    });

    xit("with the devMode developer calculates bubble size scale if serie mode is bubble", () => {
        defaultProps.scatterData = getData(defaultProps as LineChartProps);
        defaultProps.seriesOptions = [ "{ \"mode\": \"lines\" }" ];
        defaultProps.devMode = "developer";
        const chart = renderShallowChart(defaultProps as LineChartProps);
        const chartInstance: any = chart.instance();
        chartInstance.chartNode = document.createElement("div");

        expect(chartInstance.getData(defaultProps)).toEqual([
            { ...defaultProps.scatterData[0], mode: "lines", visible: true, customdata: undefined }
        ]);
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
            spyOn(style, "getTooltipCoordinates").and.returnValue({ x: 4, y: 10 });
            const instance = chart.instance() as any;
            instance.onHover(plotlyEventData);

            expect(defaultProps.onHover)
                .toHaveBeenCalledWith(instance.tooltipNode, sampleSeries[0].tooltipForm, plotlyEventData.points[0].customdata); // tslint:disable-line max-line-length
        });
    });

    it("saves a reference of the tooltip node", () => {
        const chart = renderFullChart(defaultProps as LineChartProps);
        const instance: any = chart.instance();

        expect(instance.tooltipNode).not.toBeUndefined();
    });
});

const getData = (props: Container.LineChartContainerProps): ScatterData[] => {
    if (props.series.length) {
        return props.series.map(series => {
            const seriesOptions = props.devMode !== "basic" && series.seriesOptions.trim()
                ? JSON.parse(series.seriesOptions)
                : {};
            const sampleData = getSampleTraces();

            return deepMerge.all([ {
                connectgaps: true,
                hoveron: "points",
                line: {
                    color: series.lineColor,
                    shape: series.lineStyle
                },
                mode: series.mode ? series.mode.replace("X", "+") as Container.LineMode : "lines",
                name: series.name,
                type: "scatter",
                fill: "none",
                x: sampleData.x || [],
                y: sampleData.y || []
            }, seriesOptions ]);
        });
    }

    return [ {
        connectgaps: true,
        hoveron: "points",
        name: "Sample",
        type: "scatter",
        ...getSampleTraces()
    } as ScatterData ];
};

const getSampleTraces = (): { x: (string | number)[], y: (string | number)[] } => {
    return {
        x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ],
        y: getRandomNumbers(4, 100)
    };
};
