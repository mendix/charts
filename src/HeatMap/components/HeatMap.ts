import { Component, ReactChild, createElement } from "react";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";

import { Container } from "../../utils/namespaces";
import HeatMapContainerProps = Container.HeatMapContainerProps;

import { Playground } from "../../components/Playground";
import { PlotlyChart } from "../../components/PlotlyChart";
import { getDimensions, parseStyle } from "../../utils/style";
import deepMerge from "deepmerge";
import { HeatMapData, Layout } from "plotly.js";
import "../../ui/Charts.scss";

export interface HeatMapProps extends HeatMapContainerProps {
    data?: HeatMapData;
    defaultData?: HeatMapData;
    alertMessage?: ReactChild;
    loading?: boolean;
    onClick?: (props: HeatMapProps, dataObject: mendix.lib.MxObject, mxform: mxui.lib.form._FormBase) => void;
    onHover?: (node: HTMLDivElement, dataObject: mendix.lib.MxObject) => void;
}

interface HeatMapState {
    layoutOptions: string;
    dataOptions: string;
    playgroundLoaded: boolean;
}

export interface PieTraces {
    labels: string[];
    values: number[];
}

export class HeatMap extends Component<HeatMapProps, HeatMapState> {
    private Playground: typeof Playground;

    constructor(props: HeatMapProps) {
        super(props);

        this.state = {
            layoutOptions: props.layoutOptions,
            dataOptions: props.dataOptions,
            playgroundLoaded: false
        };
    }

    render() {
        if (this.props.alertMessage) {
            return createElement(Alert, { className: `widget-heat-map-alert` },
                this.props.alertMessage
            );
        }
        if (this.props.loading || (this.props.devMode === "developer" && !this.state.playgroundLoaded)) {
            return createElement(ChartLoading, { text: "Loading" });
        }
        if (this.props.devMode === "developer" && this.state.playgroundLoaded) {
            return null;
        }

        return this.renderChart();
    }

    componentWillReceiveProps(newProps: HeatMapProps) {
        if (newProps.devMode === "developer" && !this.state.playgroundLoaded) {
            this.loadPlaygroundComponent();
        }
    }

    private async loadPlaygroundComponent() {
        const { Playground: PlaygroundImport } = await import("../../components/Playground");
        this.Playground = PlaygroundImport;
        console.log(this.Playground); // tslint:disable-line
        this.setState({ playgroundLoaded: true });
    }

    private renderChart() {
        return createElement(PlotlyChart,
            {
                type: "any",
                className: this.props.class,
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) },
                data: this.getData(this.props),
                layout: this.getLayoutOptions(this.props),
                config: { displayModeBar: false, doubleClick: false }
            }
        );
    }

    private getData(props: HeatMapProps): (HeatMapData & { type: "heatmap" })[] {
        if (this.props.data) {
            return [
                {
                    ...this.props.data,
                    type: "heatmap"
                }
            ];
        }

        return this.props.defaultData ? [ { ...this.props.defaultData, type: "heatmap" } ] : [];
    }

    private getLayoutOptions(props: HeatMapProps): Partial<Layout> {
        const advancedOptions = props.devMode !== "basic" && this.state.layoutOptions
            ? JSON.parse(this.state.layoutOptions)
            : {};

        return deepMerge.all([
            HeatMap.getDefaultLayoutOptions(props),
            { annotations: this.props.showValues ? this.getTextAnnotations() : undefined },
            advancedOptions
        ]);
    }

    private getTextAnnotations() {
        const annotations: {}[] = [];
        if (this.props.data) {
            for (let i = 0; i < this.props.data.y.length; i++) {
                for (let j = 0; j < this.props.data.x.length; j++) {
                    const currentValue = this.props.data.z[ i ][ j ];
                    const textColor = currentValue !== 0.0 ? "white" : "black";
                    const result = {
                        xref: "x1",
                        yref: "y1",
                        x: this.props.data.x[ j ],
                        y: this.props.data.y[ i ],
                        text: this.props.data.z[ i ][ j ],
                        font: {
                            family: "Arial",
                            size: 12,
                            color: textColor
                        },
                        showarrow: false
                    };
                    annotations.push(result);
                }
            }
        }

        return annotations;
    }

    public static getDefaultLayoutOptions(props: HeatMapProps): Partial<Layout> {
        return {
            autosize: true,
            showarrow: false,
            xaxis: { fixedrange: true },
            yaxis: { fixedrange: true }
        };
    }
}
