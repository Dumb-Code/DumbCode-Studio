import ClickableInput from "../../../components/ClickableInput"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross, SVGPlus, SVGUpload } from "../../../components/Icons"
import { useStudio } from "../../../contexts/StudioContext"
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation"
import { loadDCAAnimation } from "../../../studio/formats/animations/DcaLoader"
import DcProject from "../../../studio/formats/DcProject"
import { ReadableFile, readFileArrayBuffer, SaveIcon } from "../../../studio/util/FileTypes"
import { useFileUpload } from "../../../studio/util/FileUploadBox"
import { useListenableObject } from "../../../studio/util/ListenableObject"
import { StudioBuffer } from "../../../studio/util/StudioBuffer"

const animationExtensions = [".dca"]

const ProjectAnimations = () => {
    const { hasProject, getSelectedProject } = useStudio()

    const addAnimation = (animation: DcaAnimation) => {
        const tabs = getSelectedProject().animationTabs
        tabs.animations.value = tabs.animations.value.concat([animation])
        tabs.tabs.value = tabs.tabs.value.concat([animation.identifier])
        tabs.selectedAnimation.value = animation
    }

    const uploadFile = (file: ReadableFile) => {
        const project = getSelectedProject()
        readFileArrayBuffer(file)
            .then(buff =>
                addAnimation(loadDCAAnimation(project, file.name.substring(0, file.name.lastIndexOf(".")), new StudioBuffer(buff)))
            )
    }
    const [ref, isDragging] = useFileUpload<HTMLDivElement>(animationExtensions, uploadFile)

    return (
        <div ref={ref} className={`rounded-sm ${isDragging ? 'bg-red-800' : 'bg-gray-800'} h-full flex flex-col overflow-hidden`}>
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1 flex flex-row">
                <p className="flex-grow mt-1 ml-1">ANIMATIONS</p>
                <p className="flex flex-row">
                    <button className="icon-button" onClick={() => addAnimation(new DcaAnimation(getSelectedProject(), "New Animation"))}><SVGPlus className="h-4 w-4 mr-1" /></button>
                    <ClickableInput
                        onFile={uploadFile}
                        accept={animationExtensions}
                        multiple
                        description="Texture Files"
                        className="icon-button"
                    >
                        <SVGUpload className="h-4 w-4 mr-1" />
                    </ClickableInput>
                </p>
            </div>
            <div className="flex flex-col overflow-y-scroll h-full w-full pr-6">
                {hasProject && <AnimationEntries project={getSelectedProject()} />}
            </div>
        </div >
    )
}

const AnimationEntries = ({ project }: { project: DcProject }) => {
    const [animations, setAnimations] = useListenableObject(project.animationTabs.animations)
    const [tabs, setTabs] = useListenableObject(project.animationTabs.tabs)
    return (<>
        {animations.map(animation =>
            <AnimationEntry
                key={animation.identifier}
                animation={animation}
                selected={tabs.includes(animation.identifier)}
                toggleAnimation={() => {
                    if (tabs.includes(animation.identifier)) {
                        setTabs(tabs.filter(t => t !== animation.identifier))
                    } else {
                        setTabs([animation.identifier].concat(tabs))
                    }
                }}
                removeAnimation={() => setAnimations(animations.filter(a => a !== animation))}
            />)}
    </>)
}

const AnimationEntry = ({ animation, selected, toggleAnimation, removeAnimation }: { animation: DcaAnimation, selected: boolean, toggleAnimation: () => void, removeAnimation: () => void }) => {
    return (
        <div className={(selected ? "bg-yellow-500" : "bg-gray-700 text-white") + " my-1 rounded-sm h-8 text-left pl-2 w-full flex flex-row ml-2"} onClick={toggleAnimation}>
            <DblClickEditLO obj={animation.name} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full bg-gray-500 text-black" />
            <p className="mr-2 flex flex-row text-white">
                <button className={(selected ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 mr-1"}><SaveIcon className="h-4 w-4" /></button>
                <button onClick={e => { removeAnimation(); e.stopPropagation() }} className={(selected ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}><SVGCross className="h-4 w-4 group-hover:text-red-500" /></button>
            </p>
        </div>
    )
}

export default ProjectAnimations;