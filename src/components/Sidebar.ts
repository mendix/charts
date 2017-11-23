import { Component, createElement } from "react";
import * as classNames from "classnames";

import "../ui/Sidebar.scss";

interface SidebarProps {
    className?: string;
    open: boolean;
    onClick?: () => void;
    onBlur?: () => void;
}

export class Sidebar extends Component<SidebarProps, {}> {
    constructor(props: SidebarProps) {
        super(props);

        this.overlayClicked = this.overlayClicked.bind(this);
    }

    render() {
        return createElement("div",
            {
                className: classNames("widget-sidebar", this.props.className, {
                    "widget-sidebar-open": this.props.open
                }),
                onClick: this.props.onClick
            },
            createElement("div", { className: "overlay", onClick: this.overlayClicked }),
            this.props.children
        );
    }

    private overlayClicked() {
        if (this.props.open && this.props.onBlur) {
            this.props.onBlur();
        }
    }
}
