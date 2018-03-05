import { createElement } from "react";
import { mount, shallow } from "enzyme";
import { mockMendix } from "../../tests/mocks/Mendix";

import { Alert } from "../components/Alert";
import { ChartLoading } from "../components/ChartLoading";
import { BubbleChart, BubbleChartProps } from "../BubbleChart/components/BubbleChart";
import { Container, Data } from "../utils/namespaces";
import "../components/SeriesPlayground";
import { PlotlyChart } from "../components/PlotlyChart";

import { getRandomNumbers } from "../utils/data";
import deepMerge from "deepmerge";
import { ScatterData, ScatterHoverData } from "plotly.js";
import SeriesProps = Data.SeriesProps;
import SeriesData = Data.SeriesData;

describe("BubbleChart", () => {
    const renderShallowChart = (props: BubbleChartProps) => shallow(createElement(BubbleChart, props));
    const renderFullChart = (props: BubbleChartProps) => mount(createElement(BubbleChart, props));
    let defaultProps: Partial<BubbleChartProps>;
    const sampleSeries: Partial<SeriesProps>[] = [
        {
            name: "Series 1",
            seriesOptions: "",
            tooltipForm: "myTooltipForm.xml"
        }
    ];
    const mockData: SeriesData<SeriesProps>[] = [
        {
            data: [ mockMendix.lib.MxObject() ] as any,
            series: sampleSeries[0] as SeriesProps
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
            series: sampleSeries as SeriesProps[]
        };
        window.mendix = mockMendix as any;
    });

    it("with an alert message renders an alert", () => {
        defaultProps.alertMessage = "alert message";
        const chart = renderShallowChart(defaultProps as BubbleChartProps);

        expect(chart).toBeElement(
            createElement(Alert, { className: "widget-charts-bubble-alert" }, defaultProps.alertMessage)
        );
    });

    it("that is loading data renders a loading indicator", () => {
        defaultProps.loading = true;
        const chart = renderShallowChart(defaultProps as BubbleChartProps);

        expect(chart).toBeElement(createElement(ChartLoading, { text: "Loading" }));
    });

    it("whose dev mode is developer renders the playground", (done) => {
        defaultProps.devMode = "developer";
        const renderPlaygroundSpy = spyOn(BubbleChart.prototype, "renderPlayground" as any).and.callThrough();
        const chart = renderShallowChart(defaultProps as BubbleChartProps);

        window.setTimeout(() => {
            expect(renderPlaygroundSpy).toHaveBeenCalled();

            done();
        }, 500);
    });

    it("whose dev mode is advanced does not render the playground", (done) => {
        defaultProps.devMode = "advanced";
        const renderPlaygroundSpy = spyOn(BubbleChart.prototype, "renderPlayground" as any).and.callThrough();
        const chart = renderShallowChart(defaultProps as BubbleChartProps);

        window.setTimeout(() => {
            expect(renderPlaygroundSpy).not.toHaveBeenCalled();

            done();
        }, 500);
    });

    it("whose dev mode is basic does not render the playground", (done) => {
        defaultProps.devMode = "basic";
        const renderPlaygroundSpy = spyOn(BubbleChart.prototype, "renderPlayground" as any).and.callThrough();
        const chart = renderShallowChart(defaultProps as BubbleChartProps);

        window.setTimeout(() => {
            expect(renderPlaygroundSpy).not.toHaveBeenCalled();

            done();
        }, 500);
    });

    it("with no alert message, isn't loading and whose dev mode isn't set to developer renders the chart correctly", () => {
        const chart = renderShallowChart(defaultProps as BubbleChartProps);

        expect(chart).toBeElement(
            createElement(PlotlyChart,
                {
                    type: "bubble",
                    style: { width: "100%", height: "100px" },
                    layout: BubbleChart.defaultLayoutConfigs(defaultProps as BubbleChartProps),
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
        const chart = renderShallowChart(defaultProps as BubbleChartProps);
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
        chart.setProps(defaultProps as BubbleChartProps);

        expect(chart.state()).toEqual({
            layoutOptions: defaultProps.layoutOptions,
            series: defaultProps.series,
            seriesOptions: defaultProps.seriesOptions,
            scatterData: defaultProps.scatterData,
            playgroundLoaded: false
        });
    });

    it("with the devMode basic should not merge the modeler JSON layout options", () => {
        defaultProps.layoutOptions = "{ 'title': 'My Bubble Chart Title' }";
        defaultProps.devMode = "basic";
        const chart = renderShallowChart(defaultProps as BubbleChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getLayoutOptions(defaultProps)).toEqual(
            BubbleChart.defaultLayoutConfigs(defaultProps as BubbleChartProps)
        );
    });

    it("with the devMode developer should merge the modeler JSON layout options", () => {
        defaultProps.layoutOptions = "{ \"title\": \"My Bubble Chart Title\" }";
        defaultProps.devMode = "developer";
        const chart = renderShallowChart(defaultProps as BubbleChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getLayoutOptions(defaultProps)).toEqual({
            ...BubbleChart.defaultLayoutConfigs(defaultProps as BubbleChartProps),
            title: "My Bubble Chart Title"
        });
    });

    it("with the devMode advanced should merge the modeler JSON layout options", () => {
        defaultProps.layoutOptions = "{ \"title\": \"My Bubble Chart\" }";
        defaultProps.devMode = "advanced";
        const chart = renderShallowChart(defaultProps as BubbleChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getLayoutOptions(defaultProps)).toEqual({
            ...BubbleChart.defaultLayoutConfigs(defaultProps as BubbleChartProps),
            title: "My Bubble Chart"
        });
    });

    it("with the devMode basic should not merge the modeler JSON series options", () => {
        defaultProps.scatterData = getData(defaultProps as BubbleChartProps);
        defaultProps.seriesOptions = [ "{ \"title\": \"My title\" }" ];
        defaultProps.devMode = "basic";
        const chart = renderShallowChart(defaultProps as BubbleChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getData(defaultProps)).toEqual([
            { ...defaultProps.scatterData[0], customdata: undefined }
        ]);
    });

    it("with the devMode advanced should merge the modeler JSON series options", () => {
        defaultProps.scatterData = getData(defaultProps as BubbleChartProps);
        defaultProps.seriesOptions = [ "{ \"showlegend\": false }" ];
        defaultProps.devMode = "advanced";
        const chart = renderShallowChart(defaultProps as BubbleChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getData(defaultProps)).toEqual([
            { ...defaultProps.scatterData[0], showlegend: false, customdata: undefined }
        ]);
    });

    it("with the devMode developer should merge the modeler JSON series options", () => {
        defaultProps.scatterData = getData(defaultProps as BubbleChartProps);
        defaultProps.seriesOptions = [ "{ \"showlegend\": true }" ];
        defaultProps.devMode = "developer";
        const chart = renderShallowChart(defaultProps as BubbleChartProps);
        const chartInstance: any = chart.instance();

        expect(chartInstance.getData(defaultProps)).toEqual([
            { ...defaultProps.scatterData[0], showlegend: true, customdata: undefined }
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
            const chart = renderShallowChart(defaultProps as BubbleChartProps);
            (chart.instance() as any).onClick(plotlyEventData);

            expect(defaultProps.onClick).toHaveBeenCalled();
        });

        it("#onHover() calls the parent onClick handler", () => {
            defaultProps.onHover = jasmine.createSpy("onHover");
            const chart = renderFullChart(defaultProps as BubbleChartProps);
            const instance = chart.instance() as any;
            instance.onHover(plotlyEventData);

            expect(defaultProps.onHover)
                .toHaveBeenCalledWith(instance.tooltipNode, sampleSeries[0].tooltipForm, plotlyEventData.points[0].customdata); // tslint:disable-line max-line-length
        });
    });

    it("saves a reference of the tooltip node", () => {
        const chart = renderFullChart(defaultProps as BubbleChartProps);
        const instance: any = chart.instance();

        expect(instance.tooltipNode).not.toBeUndefined();
    });
});

const getData = (props: Container.BubbleChartContainerProps): ScatterData[] => {
    if (props.series.length) {
        return props.series.map(series => {
            const seriesOptions = props.devMode !== "basic" && series.seriesOptions.trim()
                ? JSON.parse(series.seriesOptions)
                : {};
            const sampleData = getSampleTraces();

            return deepMerge.all([ {
                name: series.name,
                marker: {
                    color: series.color
                },
                type: "scatter",
                x: sampleData.x || [],
                y: sampleData.y || []
            }, seriesOptions ]);
        });
    }

    return [ {
            type: "scatter",
            name: "Sample",
            ...getSampleTraces()
        } ] as ScatterData[];
};

const getSampleTraces = (): { x: (string | number)[], y: (string | number)[] } => {
    return {
        x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4" ],
        y: getRandomNumbers(4, 100)
    };
};
