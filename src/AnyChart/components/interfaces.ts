import { Dimensions } from "../../utils/style";
import { WrapperProps } from "../../utils/types";

export interface AnyChartContainerPropsBase extends WrapperProps, Dimensions {
    dataStatic: string;
    dataAttribute: string;
    layoutStatic: string;
    layoutAttribute: string;
    eventEntity: string;
    eventDataAttribute: string;
    onClickMicroflow: string;
    tooltipEntity: string;
    tooltipMicroflow: string;
    tooltipForm: string;
}
