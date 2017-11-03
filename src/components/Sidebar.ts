import { Component, createElement } from "react";
import * as classNames from "classnames";

import "../ui/Sidebar.css";

interface SidebarProps {
    className?: string;
    open: boolean;
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
                className: classNames("control-sidebar", "control-sidebar-light", this.props.className, {
                    "control-sidebar-open": this.props.open
                })
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
