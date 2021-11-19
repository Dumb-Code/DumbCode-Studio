import { useEffect, useRef } from 'react';
export const useAnimationHook = (active: boolean, callback: (percent: number) => void, animationStepMs = 10, animationDurationMs = 200) => {

    const currentActive = useRef<boolean>()
    const currentPercentage = useRef<number>()
    const timeoutRef = useRef<NodeJS.Timeout>()
    const totalmsRun = useRef<number>(0)

    useEffect(() => {
        const clear = () => {
            if (timeoutRef.current !== undefined) {
                clearInterval(timeoutRef.current)
                timeoutRef.current = undefined
            }
        }
        if (currentActive.current !== active || totalmsRun.current < animationDurationMs) {
            if (currentActive.current !== active) {
                totalmsRun.current = 0
            }

            const fromPercent = currentPercentage.current ?? 0
            const targetPercent = active ? 1 : 0
            timeoutRef.current = setInterval(() => {
                totalmsRun.current += animationStepMs
                currentPercentage.current = fromPercent + (targetPercent - fromPercent) * (totalmsRun.current / animationDurationMs);

                callback(currentPercentage.current)

                if (totalmsRun.current >= animationDurationMs) {
                    currentPercentage.current = targetPercent
                    callback(targetPercent)
                    clear()
                }
            }, animationStepMs)
        }
        currentActive.current = active
        return () => clear()
    })
}