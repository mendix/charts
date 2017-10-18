import { SFC, createElement } from "react";
import * as classNames from "classnames";

interface TabPaneProps {
    active?: boolean;
}

export const TabPane: SFC<TabPaneProps> = props =>
    createElement("div", { className: classNames("tab-pane", { active: props.active }) },
        props.children
    );
