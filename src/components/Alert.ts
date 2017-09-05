import { ReactElement, SFC, createElement } from "react";
import * as classNames from "classnames";

export interface AlertProps {
    bootstrapStyle?: "default" | "primary" | "success" | "info" | "warning" | "danger";
    className?: string;
    message: string | ReactElement<any>;
}

export const Alert: SFC<AlertProps> = ({ bootstrapStyle, className, message }) =>
    message
        ? createElement("div", { className: classNames(`alert alert-${bootstrapStyle}`, className) }, message)
        : null;

Alert.displayName = "Alert";
Alert.defaultProps = { bootstrapStyle: "danger" };
