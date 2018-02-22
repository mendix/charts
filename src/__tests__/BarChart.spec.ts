import { createElement } from "react";
import { mount, shallow } from "enzyme";
import { ScatterData, ScatterHoverData } from "plotly.js";

import { Alert } from "../components/Alert";
import { BarChart, BarChartProps } from "../BarChart/components/BarChart";
import { preview } from "../BarChart/BarChart.webmodeler";
import { ChartLoading } from "../components/ChartLoading";
import { PlotlyChart } from "../components/PlotlyChart";
import "../components/SeriesPlayground";

import { mockMendix } from "../../tests/mocks/Mendix";
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
            seriesOptions: "{}",
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
            series: sampleSeries as SeriesProps[],
            devMode: "basic",
            width: 100,
            widthUnit: "percentage",
            height: 100,
            heightUnit: "pixels",
            layoutOptions: "{}",
            seriesOptions: [ "{}" ],
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

    it("whose dev mode is developer renders the playground", (done) => {
        const renderPlaygroundSpy = spyOn(BarChart.prototype, "renderPlayground" as any).and.callThrough();
        defaultProps.devMode = "developer";
        const chart = renderShallowBarChart(defaultProps as BarChartProps);

        window.setTimeout(() => {
            expect(renderPlaygroundSpy).toHaveBeenCalled();

            done();
        }, 1000);
    });

    it("whose dev mode is basic does not renders the playground", (done) => {
        defaultProps.devMode = "basic";
        const renderPlaygroundSpy = spyOn(BarChart.prototype, "renderPlayground" as any).and.callThrough();
        const chart = renderShallowBarChart(defaultProps as BarChartProps);

        window.setTimeout(() => {
            expect(renderPlaygroundSpy).not.toHaveBeenCalled();

            done();
        }, 500);
    });

    it("whose dev mode is advanced does not renders the playground", () => {
        const renderPlaygroundSpy = spyOn(BarChart.prototype, "renderPlayground" as any).and.callThrough();
        defaultProps.devMode = "advanced";
        const chart = renderShallowBarChart(defaultProps as BarChartProps);

        expect(renderPlaygroundSpy).not.toHaveBeenCalled();
    });
    // tslint:disable-next-line max-line-length
    it("with no alert message, isn't loading and whose dev mode isn't set to developer renders the chart correctly", () => {
        defaultProps.series = [];
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

    it("updates the state with the new props when the props are changed", () => {
        const chart = renderShallowBarChart(defaultProps as BarChartProps);
        defaultProps.layoutOptions = "{}";
        defaultProps.seriesOptions = [ "{}" ];
        defaultProps.series = [
            {
                name: "Series 2",
                seriesOptions: "",
                tooltipForm: "myTooltipForm.xml"
            }
        ] as SeriesProps[];
        defaultProps.scatterData = [
            {
                x: [ 1, 2, 3 ],
                y: [ 2, 4, 6 ]
            }
        ] as ScatterData[];
        chart.setProps(defaultProps as BarChartProps);

        expect(chart.state()).toEqual({
            layoutOptions: defaultProps.layoutOptions,
            series: defaultProps.series,
            seriesOptions: defaultProps.seriesOptions,
            scatterData: defaultProps.scatterData,
            playgroundLoaded: false
        });
    });

    it("with the devMode basic should not merge the modeler JSON layout options", () => {
        defaultProps.layoutOptions = "{ 'title': 'My Title' }";
        defaultProps.devMode = "basic";
        const chart = renderShallowBarChart(defaultProps as BarChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getLayoutOptions(defaultProps)).toEqual(
            BarChart.defaultLayoutConfigs(defaultProps as BarChartProps)
        );
    });

    it("with the devMode developer should merge the modeler JSON layout options", () => {
        defaultProps.layoutOptions = "{ \"title\": \"My Title\" }";
        defaultProps.devMode = "developer";
        const chart = renderShallowBarChart(defaultProps as BarChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getLayoutOptions(defaultProps)).toEqual({
            ...BarChart.defaultLayoutConfigs(defaultProps as BarChartProps),
            title: "My Title"
        });
    });

    it("with the devMode advanced should merge the modeler JSON layout options", () => {
        defaultProps.layoutOptions = "{ \"title\": \"My Title\" }";
        defaultProps.devMode = "advanced";
        const chart = renderShallowBarChart(defaultProps as BarChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getLayoutOptions(defaultProps)).toEqual({
            ...BarChart.defaultLayoutConfigs(defaultProps as BarChartProps),
            title: "My Title"
        });
    });

    it("with the devMode basic should not merge the modeler JSON series options", () => {
        defaultProps.scatterData = preview.getData(defaultProps as BarChartProps);
        defaultProps.seriesOptions = [ "{ \"orientation\": \"v\" }" ];
        defaultProps.devMode = "basic";
        const chart = renderShallowBarChart(defaultProps as BarChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getData(defaultProps)).toEqual(defaultProps.scatterData);
    });

    it("with the devMode advanced should merge the modeler JSON series options", () => {
        defaultProps.scatterData = preview.getData(defaultProps as BarChartProps);
        defaultProps.seriesOptions = [ "{ \"orientation\": \"v\" }" ];
        defaultProps.devMode = "advanced";
        const chart = renderShallowBarChart(defaultProps as BarChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getData(defaultProps)).toEqual([
            { ...defaultProps.scatterData[0], orientation: "v", customdata: undefined }
        ]);
    });

    it("with the devMode developer should merge the modeler JSON series options", () => {
        defaultProps.scatterData = preview.getData(defaultProps as BarChartProps);
        defaultProps.seriesOptions = [ "{ \"orientation\": \"v\" }" ];
        defaultProps.devMode = "developer";
        const chart = renderShallowBarChart(defaultProps as BarChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getData(defaultProps)).toEqual([
            { ...defaultProps.scatterData[0], orientation: "v", customdata: undefined }
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

        it("#onClick() calls the parent onClick handler when one is specified", () => {
            defaultProps.onClick = jasmine.createSpy("onClick");
            const chart = renderShallowBarChart(defaultProps as BarChartProps);
            (chart.instance() as any).onClick(plotlyEventData);

            expect(defaultProps.onClick).toHaveBeenCalled();
        });

        it("#onHover() calls the parent onHover handler when one is specified", () => {
            defaultProps.onHover = jasmine.createSpy("onHover");
            const chart = renderFullBarChart(defaultProps as BarChartProps);
            const instance = chart.instance() as any;
            instance.onHover(plotlyEventData);

            expect(defaultProps.onHover)
                .toHaveBeenCalledWith(instance.tooltipNode, sampleSeries[0].tooltipForm, plotlyEventData.points[0].customdata); // tslint:disable-line max-line-length
        });
    });

    it("saves a reference of the tooltip node", () => {
        const chart = renderFullBarChart(defaultProps as BarChartProps);
        const instance: any = chart.instance();

        expect(instance.tooltipNode).toBeDefined();
    });
});
