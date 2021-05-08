import { useEffect, useRef } from "react";
import { useStudio } from "../contexts/StudioContext";

const StudioCanvas = () => {
    const { renderer, setSize } = useStudio()
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (ref.current === null) {
            throw new Error("Error: Ref is not set");
        }
        const observer = new ResizeObserver(() => {
            if (ref.current !== null) {
                setSize(ref.current.clientWidth, ref.current.clientHeight)
            }
        })

        const currentRef = ref.current

        observer.observe(currentRef)

        setSize(currentRef.clientWidth, currentRef.clientHeight)
        currentRef.appendChild(renderer.domElement)

        return () => {
            observer.disconnect()
            currentRef.removeChild(renderer.domElement)
        }
    }, [renderer.domElement, setSize])

    return (
        <div ref={ref} className="studio-canvas-container rounded-sm bg-gray-800 h-full" />
    )
}

export default StudioCanvas