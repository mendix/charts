import { SFC, createElement } from "react";
import * as classNames from "classnames";

interface TabToolProps {
    className?: string;
    onClick?: () => void;
}

export const TabTool: SFC<TabToolProps> = props =>
    createElement("li", { className: classNames(props.className || "") },
        createElement("a", { "aria-expanded": "true", "onClick": props.onClick }, props.children)
    );
