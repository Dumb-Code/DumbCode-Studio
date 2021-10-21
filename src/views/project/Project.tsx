import ProjectModels from './components/ProjectModels'
import ProjectRemote from './components/ProjectRemote'
import ProjectAnimations from './components/ProjectAnimations'
import ProjectTextures from './components/ProjectTextures'
import { useRef, useState } from 'react'
import { useAnimationHook } from '../../studio/util/AnimationHooks'

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

const Project = () => {

    const[remoteShown, showRemote] = useState(false);
    
    const gridRef = useRef<HTMLDivElement>(null)
    const divHeightRef = useRef<HTMLDivElement>(null)

    useAnimationHook(remoteShown, percentRaw => {
        //Apply easing function to percentRaw
        const percent = easeInOutCubic(percentRaw)

        if(gridRef.current !== null) {
            gridRef.current.style.gridTemplateRows = `auto ${44 + (237 - 44) * percent}px`
        }

        if(divHeightRef.current !== null) {
            divHeightRef.current.style.height = `${0 + (12 - 0) * percent}rem`
        }
    })


    return (
        <div ref={gridRef} className="h-full grid grid-areas-project overflow-hidden mx-2 bg-white dark:bg-black transition-grid-template-rows ease-in-out duration-200"
            style={{
                gridTemplateColumns: '30% 30% 40%',
                gridTemplateRows: "auto 44px"
            }}
        >
            <div className="p-2 bg-gray-200 dark:bg-black grid-in-remote"><ProjectRemote remoteShown={remoteShown} showRemote={showRemote} divHeightRef={divHeightRef} /></div>
            <div className="p-2 bg-gray-200 dark:bg-black grid-in-model"><ProjectModels /></div>
            <div className="p-2 bg-gray-200 dark:bg-black grid-in-texture"><ProjectTextures /></div>
            <div className="p-2 bg-gray-200 dark:bg-black grid-in-animation"><ProjectAnimations /></div>
        </div>
    )
}

export default Project;