import { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { useTooltipRef } from "../contexts/TooltipContext";

export const ButtonWithTooltip = (props: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { tooltip: string, delay?: number }>) => {
    const { tooltip, delay, children } = props
    const ref = useTooltipRef<HTMLButtonElement>(() => tooltip, delay)
    return (
        <button ref={ref} {...props}>
            {children}
        </button>
    )
}