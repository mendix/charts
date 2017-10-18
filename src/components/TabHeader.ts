import { SFC, createElement } from "react";
import * as classNames from "classnames";

interface TabHeaderProps {
    active?: boolean;
    className?: string;
    title: string;
    iconClasses?: string;
    onClick?: () => void;
}

export const TabHeader: SFC<TabHeaderProps> = props =>
    createElement("li", { className: classNames(props.className || "", { active: props.active }) },
        createElement("a", { "aria-expanded": "true", "onClick": props.onClick }, props.title)
    );
