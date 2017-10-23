import { Component, createElement } from "react";
import * as className from "classnames";

import "../ui/Sidebar.css";

export class Sidebar extends Component<{ className?: string, open: boolean }, {}> {
    render() {
        return createElement("div", {
            className: className("control-sidebar", "control-sidebar-light", this.props.className, {
                "control-sidebar-open": this.props.open
            })
        }, this.props.children);
    }
}
