import { Component, ReactElement, ReactNode, cloneElement, createElement, isValidElement } from "react";
import * as classNames from "classnames";

import { SidebarHeader } from "./SidebarHeader";
import "../ui/Sidebar.scss";
import { SidebarContent } from "./SidebarContent";

interface SidebarProps {
    className?: string;
    open: boolean;
    onClick?: () => void;
    onBlur?: () => void;
    onClose?: () => void;
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
            createElement("div", { className: "sidebar-content" },
                this.getSidebarElement("HEADER"),
                this.getSidebarElement("CONTENT")
            )
        );
    }

    private getSidebarElement(type: "HEADER" | "CONTENT") {
        let element: ReactNode = this.props.children;
        if (this.props.children) {
            if (Array.isArray(this.props.children)) {
                 element = this.props.children.find((child) =>
                    isValidElement(child) && child.type === (type === "HEADER" ? SidebarHeader : SidebarContent)
                );
            }
        }
        if (isValidElement(element)) {
            return type === "HEADER"
                ? cloneElement(element as ReactElement<any>, { onClose: this.props.onClose })
                : element;
        }

        return null;
    }

    private overlayClicked() {
        if (this.props.open && this.props.onBlur) {
            this.props.onBlur();
        }
    }
}
