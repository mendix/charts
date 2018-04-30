import { AxisType, BarMode, Datum, ScatterData, ScatterMarker } from "plotly.js";
import { ReactChild } from "react";
import { ChartConfigs } from "./configs";

export namespace Container {
    import SeriesProps = Data.SeriesProps;

    export interface WrapperProps {
        "class"?: string;
        mxform: mxui.lib.form._FormBase;
        mxObject?: mendix.lib.MxObject;
        style?: string;
        readOnly: boolean;
        friendlyId: string;
    }

    export interface LayoutProps {
        defaultData?: ScatterData[];
        grid: "none" | "horizontal" | "vertical" | "both";
        showLegend: boolean;
        xAxisLabel: string;
        yAxisLabel: string;
        layoutOptions: string;
        configurationOptions: string;
        devMode: "basic" | "advanced" | "developer";
    }

    export interface BarLayoutProps extends LayoutProps {
        barMode: BarMode;
        orientation: "bar" | "column";
    }

    export interface LineLayoutProps extends LayoutProps {
        fill: boolean;
        area?: "separate" | "stacked";
        showRangeSlider: boolean;
        xAxisType?: AxisType;
        rangeMode?: RangeMode;
        polar?: PolarOptions;
    }

    export type RangeMode = "normal" | "tozero" | "nonnegative";

    export type LineMode = "lines" | "markers" | "lines+markers" | "none";

    export interface PolarOptions {
        radialaxis?: Partial<{
            rangemode: RangeMode;
            gridcolor: string;
            showgrid: boolean;
            tickcolor: string;
        }>;
        angularaxis?: Partial<{
            linecolor: string;
            tickcolor: string;
        }>;
    }

    export interface BarChartContainerProps extends WrapperProps, Style.Dimensions, Style.Appearance, BarLayoutProps {
        series: Data.SeriesProps[];
        restParameters: RestParameter[];
    }

    export interface BarChartContainerState {
        alertMessage?: ReactChild;
        data?: Data.SeriesData<SeriesProps>[];
        scatterData?: ScatterData[];
        seriesOptions: string[];
        loading?: boolean;
        themeConfigs: ChartConfigs;
    }

    export interface LineChartContainerProps extends WrapperProps, Style.Dimensions, Style.Appearance, LineLayoutProps {
        series: Data.LineSeriesProps[];
        type: "line" | "bubble" | "polar" | "area" | "timeseries";
        restParameters: Container.RestParameter[];
    }

    export interface RestParameter {
        parameterAttribute: string;
    }

    export interface LineChartContainerState {
        alertMessage?: ReactChild;
        data?: Data.SeriesData<Data.LineSeriesProps>[];
        scatterData?: ScatterData[];
        seriesOptions: string[];
        loading?: boolean;
        themeConfigs: ChartConfigs;
    }

    export type PieChartType = "pie" | "donut";

    export interface PieChartContainerProps extends Data.DataSourceProps, Style.Dimensions, Style.Appearance, Data.EventProps, WrapperProps {
        nameAttribute: string;
        valueAttribute: string;
        sortAttribute: string;
        colors: { color: string }[];
        sortOrder: Data.SortOrder;
        chartType: PieChartType;
        showLegend: boolean;
        layoutOptions: string;
        configurationOptions: string;
        dataOptions: string;
        devMode: "basic" | "advanced" | "developer";
    }

    export interface HeatMapContainerProps extends Data.DataSourceProps, Style.Dimensions, Style.Appearance, Data.EventProps, WrapperProps {
        valueAttribute: string;
        horizontalNameAttribute: string;
        horizontalSortAttribute: string;
        verticalNameAttribute: string;
        verticalSortAttribute: string;
        horizontalSortOrder: Data.SortOrder;
        verticalSortOrder: Data.SortOrder;
        showScale: boolean;
        scaleColors: ScaleColors[];
        showValues: boolean;
        smoothColor: boolean;
        valuesColor: string;
        xAxisLabel: string;
        yAxisLabel: string;
        layoutOptions: string;
        configurationOptions: string;
        dataOptions: string;
        devMode: "basic" | "advanced" | "developer";
    }

    export interface PolarChartContainerProps extends LineChartContainerProps {
        showGrid: boolean;
    }
    export interface ScaleColors {
        valuePercentage: number;
        colour: number;
    }
    export interface AnyChartContainerPropsBase extends WrapperProps, Style.Dimensions {
        dataStatic: string;
        dataAttribute: string;
        sampleData: string;
        layoutStatic: string;
        layoutAttribute: string;
        configurationOptions: string;
        sampleLayout: string;
        eventEntity: string;
        eventDataAttribute: string;
        onClickMicroflow: string;
        tooltipEntity: string;
        tooltipMicroflow: string;
        tooltipForm: string;
    }

    export interface AnyChartContainerProps extends AnyChartContainerPropsBase {
        devMode: "advanced" | "developer";
    }

    export interface AnyChartContainerState {
        alertMessage?: ReactChild;
        loading: boolean;
        attributeData: string;
        attributeLayout: string;
    }
}

export namespace Data {
    export interface FetchedData<T> {
        mxObjects?: mendix.lib.MxObject[];
        restData?: RESTData;
        customData?: T;
    }

    export type RESTData = { [ key: string ]: string | number }[];

    export interface FetchDataOptions<S> {
        type: "XPath" | "microflow" | "REST";
        entity: string;
        guid: string;
        constraint?: string;
        sortAttribute?: string;
        sortOrder?: SortOrder;
        attributes?: string[];
        microflow?: string;
        url?: string;
        customData?: S; // Usage: when used in a loop, could hold a value specific to each item e.g series
    }

    export interface FetchByXPathOptions {
        guid: string;
        entity: string;
        constraint: string;
        sortAttribute?: string;
        sortOrder?: SortOrder;
        attributes?: string[];
        references?: any;
    }

    export interface DataSourceProps {
        dataSourceMicroflow: string;
        dataSourceType: "XPath" | "microflow" | "REST";
        restUrl: string;
        restParameters: Container.RestParameter[];
        entityConstraint: string;
        dataEntity: string;
    }

    export interface SeriesDataSourceProps extends DataSourceProps {
        xValueAttribute: string;
        xValueSortAttribute: string;
        sortOrder: SortOrder;
        yValueAttribute: string;
        markerSizeAttribute?: string;
        markerSizeReference: number;
        autoBubbleSize: boolean;
    }

    export type SortOrder = "asc" | "desc";

    export interface EventProps {
        onClickEvent: "doNothing" | "showPage" | "callMicroflow";
        onClickPage: string;
        onClickMicroflow: string;
        tooltipForm: string;
    }

    export interface SeriesProps extends SeriesDataSourceProps, EventProps {
        name: string;
        seriesOptions: string;
        barColor: string;
        color?: string; // All serie barColor, lineColor, bubbleColor etc should be replaced with 'color'
    }

    export interface LineSeriesProps extends SeriesProps {
        mode?: Container.LineMode;
        lineColor: string;
        lineStyle: "linear" | "spline";
        fill?: boolean;
        fillColor?: string;
    }

    export interface SeriesData<T extends SeriesProps = SeriesProps> {
        data?: mendix.lib.MxObject[];
        restData?: any;
        series: T;
    }

    export interface ScatterTrace {
        x: Datum[];
        y: Datum[];
        marker?: Partial<ScatterMarker>;
        r?: Datum[];
        theta?: Datum[];
    }

    export interface ReferencesSpec {
        attributes?: string[];
        amount?: number;
        sort?: [ string, "desc" | "asc" ][];
        references?: {
            [ index: string ]: ReferencesSpec;
        };
    }
}

export namespace Style {
    export interface Dimensions {
        width: number;
        height: number;
        widthUnit: "percentage" | "pixels";
        heightUnit: "percentageOfWidth" | "pixels" | "percentageOfParent";
    }

    export interface Appearance {
        refreshInterval: number;
    }
}
