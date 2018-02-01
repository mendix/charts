import { Component, ReactChild, ReactElement, createElement } from "react";

import { Alert } from "../../components/Alert";
import { ChartLoading } from "../../components/ChartLoading";

import { Container } from "../../utils/namespaces";
import HeatMapContainerProps = Container.HeatMapContainerProps;

import deepMerge from "deepmerge";
import { PiePlayground } from "../../PieChart/components/PiePlayground";
import { PlotlyChart } from "../../components/PlotlyChart";
import { HeatMapData, Layout, ScatterHoverData } from "plotly.js";
import { getDimensions, parseStyle } from "../../utils/style";

import "../../ui/Charts.scss";

export interface HeatMapProps extends HeatMapContainerProps {
    data?: HeatMapData;
    defaultData?: HeatMapData;
    alertMessage?: ReactChild;
    loading?: boolean;
    onClick?: (x: string, y: string, z: number) => void;
    onHover?: (node: HTMLDivElement, x: string, y: string, z: number) => void;
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
    state = {
        layoutOptions: this.props.layoutOptions,
        dataOptions: this.props.dataOptions,
        playgroundLoaded: false
    };
    private tooltipNode: HTMLDivElement;
    private Playground: typeof PiePlayground;

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
            return this.renderPlayground();
        }

        return this.renderChart();
    }

    componentWillReceiveProps(newProps: HeatMapProps) {
        if (newProps.devMode === "developer" && !this.state.playgroundLoaded) {
            this.loadPlaygroundComponent();
        }
    }

    private getTooltipNodeRef = (node: HTMLDivElement) => {
        this.tooltipNode = node;
    }

    private async loadPlaygroundComponent() {
        const { PiePlayground: PlaygroundImport } = await import("../../PieChart/components/PiePlayground");
        this.Playground = PlaygroundImport;
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
                config: { displayModeBar: false, doubleClick: false },
                onClick: this.onClick,
                onHover: this.onHover,
                getTooltipNode: this.getTooltipNodeRef
            }
        );
    }

    private renderPlayground(): ReactElement<any> {
        return createElement(this.Playground, {
            dataOptions: this.state.dataOptions || "{\n\n}",
            modelerDataConfigs: this.props.data
                ? JSON.stringify(
                {
                    colorscale: this.props.data.colorscale,
                    showscale: this.props.data.showscale,
                    type: "heatmap"
                }, null, 4)
                : "",
            onChange: this.onRuntimeUpdate,
            layoutOptions: this.state.layoutOptions || "{\n\n}",
            modelerLayoutConfigs: JSON.stringify(HeatMap.getDefaultLayoutOptions(this.props), null, 4)
        }, this.renderChart());
    }

    private getData(props: HeatMapProps): (HeatMapData & { type: "heatmap" })[] {
        if (this.props.data) {
            const advancedOptions = props.devMode !== "basic" && this.state.dataOptions
                ? JSON.parse(this.state.dataOptions)
                : {};

            const data: (HeatMapData & { type: "heatmap" }) = deepMerge.all([
                { ...this.props.data, type: "heatmap" },
                advancedOptions
            ]);
            data.colorscale = advancedOptions.colorscale || data.colorscale;

            return [ data ];
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

    private onClick = ({ points }: ScatterHoverData<any>) => {
        if (this.props.onClick) {
            this.props.onClick(points[ 0 ].x as string, points[ 0 ].y as string, points[ 0 ].z as number);
        }
    }

    private onHover = ({ points }: ScatterHoverData<any>) => {
        const { x, xaxis, y, yaxis, z } = points[0];
        if (this.props.onHover) {
            const yAxisPixels = typeof y === "number" ? yaxis.l2p(y) : yaxis.d2p(y);
            const xAxisPixels = typeof x === "number" ? xaxis.l2p(x as number) : xaxis.d2p(x);
            const positionYaxis = yAxisPixels + yaxis._offset;
            const positionXaxis = xAxisPixels + xaxis._offset;
            this.tooltipNode.style.top = `${positionYaxis}px`;
            this.tooltipNode.style.left = `${positionXaxis}px`;
            this.tooltipNode.style.opacity = "1";
            this.props.onHover(this.tooltipNode, x as string, y as string, z as number);
        }
    }

    private onRuntimeUpdate = (layoutOptions: string, dataOptions: string) => {
        this.setState({ layoutOptions, dataOptions });
    }

    public static getDefaultLayoutOptions(props: HeatMapProps): Partial<Layout> {
        return {
            autosize: true,
            showarrow: false,
            xaxis: { fixedrange: true },
            yaxis: { fixedrange: true },
            margin: {
                l: 80,
                r: 60,
                b: 60,
                t: 10,
                pad: 10
            }
        };
    }
}
