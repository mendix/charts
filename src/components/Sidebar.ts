import { SFC, createElement } from "react";
import * as classNames from "classnames";

import "../ui/Sidebar.css";

export const Sidebar: SFC<{ className?: string, open: boolean }> = ({ className, children, open }) =>
    createElement("div", {
        className: classNames("control-sidebar", "control-sidebar-light", className, {
            "control-sidebar-open": open
        })
    }, children);
