import ProjectModels from './components/ProjectModels'
import ProjectRemote from './components/ProjectRemote'
import ProjectAnimations from './components/ProjectAnimations'
import ProjectTextures from './components/ProjectTextures'
import { useState } from 'react'

const Project = () => {

    const[remoteShown, showRemote] = useState(false);

    return (
        <div className="h-full grid grid-areas-project overflow-hidden mx-2 bg-black transition-grid-template-rows ease-in-out duration-200"
            style={{
                gridTemplateColumns: '30% 30% 40%',
                gridTemplateRows: "auto " + (remoteShown ? "237px" : "44px")
            }} 
        >
            <div className="p-2 bg-gray-200 dark:bg-black grid-in-remote"><ProjectRemote remoteShown={remoteShown} showRemote={showRemote} /></div>
            <div className="p-2 bg-gray-200 dark:bg-black grid-in-model"><ProjectModels /></div>
            <div className="p-2 bg-gray-200 dark:bg-black grid-in-texture"><ProjectTextures /></div>
            <div className="p-2 bg-gray-200 dark:bg-black grid-in-animation"><ProjectAnimations /></div>
        </div>
    )
}

export default Project;