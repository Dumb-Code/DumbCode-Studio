import { ButtonHTMLAttributes, FC } from "react";
import { useTooltipRef } from "../contexts/TooltipContext";

export const ButtonWithTooltip: FC<ButtonHTMLAttributes<HTMLButtonElement> & { tooltip: string, delay?: number }> = (props) => {
    const { tooltip, delay, children } = props
    const ref = useTooltipRef<HTMLButtonElement>(() => tooltip, delay)
    return (
        <button ref={ref} {...props}>
            {children}
        </button>
    )
}