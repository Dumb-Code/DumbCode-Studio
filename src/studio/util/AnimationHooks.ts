import { useEffect } from 'react';
import { useRef } from 'react';
export const useAnimationHook = (active: boolean, callback: (percent: number) => void, animationStepMs = 10, animationDurationMs = 200) => {

    const currentActive = useRef<boolean>()
    const currentPercentage = useRef<number>()
    const timeoutRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        const clear = () => {
            if (timeoutRef.current !== undefined) {
                clearInterval(timeoutRef.current)
                timeoutRef.current = undefined
            }
        }
        if (currentActive.current !== undefined && currentActive.current !== active) {
            let totalmsRun = 0

            const oldFrom = active ? 1 : 0
            const oldTo = active ? 0 : 1

            const fromPercent = oldFrom + (oldTo - oldFrom) * (currentPercentage.current ?? 1);
            const targetPercent = active ? 1 : 0
            timeoutRef.current = setInterval(() => {
                totalmsRun += animationStepMs
                currentPercentage.current = totalmsRun / animationDurationMs
                const percent = fromPercent + (targetPercent - fromPercent) * currentPercentage.current;

                callback(percent)

                if (totalmsRun >= animationDurationMs) {
                    clear()
                }
            }, animationStepMs)
        }
        currentActive.current = active
        return () => clear()
    })
}