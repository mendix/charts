import { CSSProperties, Component, createElement } from "react";

import "../ui/HelpTooltip.scss";

interface HelpTooltipState {
    showInfo: boolean;
    style?: CSSProperties;
}

export class HelpTooltip extends Component<{ show?: boolean }, HelpTooltipState> {
    static defaultProps: Partial<{ show?: boolean }> = {
        show: false
    };
    private tooltipNode: HTMLDivElement;

    constructor(props: { show: boolean }) {
        super(props);

        this.toggleShowInfo = this.toggleShowInfo.bind(this);
        this.getRef = this.getRef.bind(this);
        this.state = { showInfo: props.show };
    }

    render() {
        return createElement("div", {
            className: "widget-help-tooltip glyphicon glyphicon-info-sign",
            onClick: this.toggleShowInfo,
            ref: this.getRef
        }, this.renderInfo());
    }

    componentDidMount() {
        if (this.tooltipNode && this.tooltipNode.parentElement) {
            this.setState({
                style: { width: `${this.tooltipNode.parentElement.clientWidth * 0.9}px` }
            });
        }
    }

    private getRef(node: HTMLDivElement) {
        this.tooltipNode = node;
    }

    private renderInfo() {
        if (this.state.showInfo) {
            return createElement("div", {
                className: "widget-help-tooltip-info",
                style: this.state.style
            }, this.props.children);
        }

        return null;
    }

    private toggleShowInfo() {
        this.setState({ showInfo: !this.state.showInfo });
    }
}
