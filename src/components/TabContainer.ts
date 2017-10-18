import { Component, ReactElement, cloneElement, createElement, isValidElement } from "react";

import { TabHeader } from "./TabHeader";
import { TabPane } from "./TabPane";
import { TabTool } from "./TabTool";

interface TabContainerProps {
    activeIndex?: number;
    header?: string;
    style?: "tabs" | "pills";
}

export class TabContainer extends Component<TabContainerProps, { activeIndex: number }> {
    static defaultProps: TabContainerProps = {
        activeIndex: 0,
        style: "tabs"
    };

    constructor(props: TabContainerProps) {
        super(props);

        this.state = {
            activeIndex: 0
        };
    }

    render() {
        return createElement("div", { className: "nav-tabs-custom mx-tabcontainer" },
            createElement("ul", { className: `nav nav-${this.props.style} mx-tabcontainer-tabs` },
                this.getHeader(),
                this.getTabElement("HEADER"),
                this.getTabTools()
            ),
            createElement("div", { className: "tab-content mx-tabcontainer-content" },
                this.getTabElement("PANE")
            )
        );
    }

    private getHeader() {
        return this.props.header
            ? createElement("li", { className: "pull-left header" }, this.props.header)
            : null;
    }

    private getTabElement(type: "HEADER" | "PANE" | "TOOL") {
        if (this.props.children && type !== "TOOL") {
            if (Array.isArray(this.props.children)) {
                const elements = this.props.children.filter((child) =>
                    isValidElement(child) && child.type === (type === "HEADER" ? TabHeader : TabPane)
                );

                return elements.map((element, index) =>
                    cloneElement(element as ReactElement<any>, {
                        active: index === this.state.activeIndex,
                        key: index,
                        onClick: type === "HEADER" ? () => this.setState({ activeIndex: index }) : null
                    })
                );
            } else if (isValidElement(this.props.children)) {
                return cloneElement(this.props.children as ReactElement<any>, { active: true });
            }
        }

        return null;
    }

    private getTabTools() {
        if (this.props.children) {
            if (Array.isArray(this.props.children)) {
                const tools = this.props.children.filter(child =>
                    isValidElement(child) && child.type === TabTool
                );

                return tools.map((tool, index) =>
                    cloneElement(tool as ReactElement<any>, { key: index })
                );
            } else if (isValidElement(this.props.children)) {
                return cloneElement(this.props.children as ReactElement<any>);
            }
        }

        return null;
    }
}
