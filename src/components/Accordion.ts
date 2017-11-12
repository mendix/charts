import { Component, createElement } from "react";
import * as classNames from "classnames";

import "../ui/Accordion.scss";

export interface AccordionProps {
    title?: string;
    className?: string;
    titleClass?: string;
    show: boolean;
    collapsible?: boolean;
}

export class Accordion extends Component<AccordionProps, { show: boolean }> {
    static defaultProps: Partial<AccordionProps> = {
        collapsible: true
    };

    constructor(props: AccordionProps) {
        super(props);

        this.state = { show: props.show };
        this.toggleShow = this.toggleShow.bind(this);
    }

    render() {
        return createElement("div", { className: classNames("widget-charts-accordion", this.props.className) },
            this.renderTitle(),
            this.state.show ? this.props.children : null
        );
    }

    componentWillReceiveProps(newProps: AccordionProps) {
        this.setState({ show: newProps.show });
    }

    private renderTitle() {
        if (this.props.title) {
            return createElement("div",
                {
                    className: classNames("widget-charts-accordion-header", this.props.titleClass)
                },
                createElement("i",
                    {
                        className: classNames("glyphicon", {
                            "hidden": !this.props.collapsible,
                            "glyphicon-menu-down": this.state.show,
                            "glyphicon-menu-right": !this.state.show
                        }),
                        onClick: this.toggleShow
                    }),
                this.props.title
            );
        }

        return null;
    }

    private toggleShow() {
        this.setState({ show: !this.state.show });
    }
}
