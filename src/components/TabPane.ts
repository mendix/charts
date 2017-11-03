import { SFC, createElement } from "react";
import * as classNames from "classnames";

interface TabPaneProps {
    active?: boolean;
    className?: string;
}

export const TabPane: SFC<TabPaneProps> = props =>
    createElement("div", { className: classNames("tab-pane", props.className, { active: props.active }) },
        props.children
    );
