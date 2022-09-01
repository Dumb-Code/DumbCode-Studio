import { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { useTooltipRef } from "../contexts/TooltipContext";

export const ButtonWithTooltip = (props: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { tooltip: string | null, delay?: number }>) => {
    const { tooltip, delay, ...restOfProps } = props
    const ref = useTooltipRef<HTMLButtonElement>(() => tooltip, delay)
    return <button ref={ref} {...restOfProps} />
}