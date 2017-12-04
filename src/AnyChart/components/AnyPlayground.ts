import { Component, createElement } from "react";
import { Playground } from "../../components/Playground";

import { AnyChart, AnyChartProps } from "./AnyChart";

interface AnyPlaygroundState {
    dataStatic: string;
    layoutStatic: string;
    attributeData: string;
    attributeLayout: string;
}

export class AnyPlayground extends Component<AnyChartProps, AnyPlaygroundState> {

    constructor(props: AnyChartProps) {
        super(props);

        this.onRuntimeUpdate = this.onRuntimeUpdate.bind(this);
        this.state = {
            layoutStatic: props.layoutStatic,
            dataStatic: props.dataStatic,
            attributeLayout: props.attributeLayout,
            attributeData: props.attributeData
        };
    }

    render() {
        return createElement(Playground, {
            any: {
                layoutStatic: this.state.layoutStatic,
                dataStatic: this.state.dataStatic,
                layoutDynamic: this.state.attributeLayout,
                dataDynamic: this.state.attributeData,
                onChange: this.onRuntimeUpdate
            },
            layoutOptions: "{\n\n}",
            modelerLayoutConfigs: "{\n\n}"
        }, this.createChart());
    }

    private createChart() {
        return createElement(AnyChart, {
            ...this.props as AnyChartProps,
            layoutStatic: this.state.layoutStatic,
            dataStatic: this.state.dataStatic,
            attributeLayout: this.state.attributeLayout,
            attributeData: this.state.attributeData
        });
    }

    componentWillReceiveProps(newProps: AnyChartProps) {
        this.setState({
            dataStatic: newProps.dataStatic,
            layoutStatic: newProps.layoutStatic,
            attributeData: newProps.attributeData,
            attributeLayout: newProps.attributeLayout
        });
    }

    private onRuntimeUpdate(layoutStatic: string, dataStatic: string, attributeLayout: string, attributeData: string) {
        this.setState({ dataStatic, layoutStatic, attributeData, attributeLayout });
    }
}
