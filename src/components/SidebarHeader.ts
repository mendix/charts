import { Component, createElement } from "react";
import * as classNames from "classnames";
import { IconButton } from "./IconButton";

interface SidebarHeaderProps {
    onClick?: () => void;
    className?: string;
    onClose?: () => void;
}

export class SidebarHeader extends Component<SidebarHeaderProps> {
    private contentSize = 9;

    render() {
        return createElement("div", { className: classNames("sidebar-content-header", this.props.className) },
            this.renderHeaderContent(),
            this.renderCloser()
        );
    }

    private renderHeaderContent() {
        this.contentSize = this.props.onClose ? this.contentSize : 12;

        return createElement("div", { className: `col-sm-${this.contentSize} col-xs-${this.contentSize}` },
            this.props.children
        );
    }

    private renderCloser() {
        if (this.props.onClose) {
            return createElement("div", { className: "col-sm-3 col-xs-3" },
                createElement(IconButton, {
                    className: "pull-right remove",
                    glyphIcon: "remove",
                    onClick: this.props.onClose
                })
            );
        }

        return null;
    }
}
