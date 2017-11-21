import { Component, createElement } from "react";
import "../ui/InfoTooltip.scss";

interface InfoTooltipState {
    show: boolean;
    width?: number;
}

export class InfoTooltip extends Component<{ show?: boolean }, InfoTooltipState> {
    static defaultProps: Partial<{ show?: boolean }> = {
        show: false
    };
    private tooltipNode: HTMLDivElement;

    constructor(props: { show: boolean }) {
        super(props);

        this.toggleShowInfo = this.toggleShowInfo.bind(this);
        this.getRef = this.getRef.bind(this);
        this.state = { show: props.show };
    }

    render() {
        return createElement("div", {
            className: "widget-info-tooltip glyphicon glyphicon-info-sign",
            onClick: this.toggleShowInfo,
            ref: this.getRef
        }, this.renderInfo());
    }

    componentDidMount() {
        if (this.tooltipNode && this.tooltipNode.parentElement) {
            this.setState({
                width: this.tooltipNode.parentElement.clientWidth * 0.9
            });
        }
    }

    private getRef(node: HTMLDivElement) {
        this.tooltipNode = node;
    }

    private renderInfo() {
        if (this.state.show) {
            return createElement("div", {
                className: "widget-info-tooltip-info",
                onClick: this.toggleShowInfo,
                style: this.state.width && { width: `${this.state.width}px` }
            }, this.props.children);
        }

        return null;
    }

    private toggleShowInfo() {
        this.setState({ show: !this.state.show });
    }
}
