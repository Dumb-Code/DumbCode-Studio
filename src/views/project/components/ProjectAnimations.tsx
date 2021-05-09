import ClickableInput from "../../../components/ClickableInput"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross, SVGDownload, SVGPlus, SVGUpload } from "../../../components/Icons"
import { useStudio } from "../../../contexts/StudioContext"
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation"
import { loadDCAAnimation } from "../../../studio/formats/animations/DcaLoader"
import DcProject from "../../../studio/formats/DcProject"
import { ReadableFile, readFileArrayBuffer } from "../../../studio/util/FileTypes"
import { useFileUpload } from "../../../studio/util/FileUploadBox"
import { useListenableObject } from "../../../studio/util/ListenableObject"
import { StudioBuffer } from "../../../studio/util/StudioBuffer"

const animationExtensions = [".dca"]

//See ProjectTexturesWrapper for more info
const ProjectAnimationsWrapper = () => {
    const { selectedProject } = useStudio()
    return <ProjectAnimations key={selectedProject.identifier} project={selectedProject} />
}

const ProjectAnimations = ({ project }: { project: DcProject }) => {

    const [animations, setAnimations] = useListenableObject(project.animationTabs.animations)
    const [tabs, setTabs] = useListenableObject(project.animationTabs.tabs)



    const addAnimation = (animation: DcaAnimation) => {
        setAnimations(animations.concat([animation]))
    }

    const uploadFile = (file: ReadableFile) =>
        readFileArrayBuffer(file)
            .then(buff =>
                addAnimation(loadDCAAnimation(project, file.name.substring(0, file.name.lastIndexOf(".")), new StudioBuffer(buff)))
            )
    const [ref, isDragging] = useFileUpload<HTMLDivElement>(animationExtensions, uploadFile)

    return (
        <div ref={ref} className={`rounded-sm bg-${isDragging ? 'red' : 'gray'}-800 h-full flex flex-col overflow-hidden`}>
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1 flex flex-row">
                <p className="flex-grow mt-1 ml-1">ANIMATIONS</p>
                <p className="flex flex-row">
                    <button disabled={project.isDefaultProject} className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 py-1 my-0.5 mr-1" onClick={() => addAnimation(new DcaAnimation(project, "New Animation"))}><SVGPlus className="h-4 w-4 mr-1" /></button>
                    <ClickableInput
                        onFile={uploadFile}
                        accept={animationExtensions}
                        disabled={project.isDefaultProject}
                        multiple
                        description="Texture Files"
                        className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 py-1 my-0.5 mr-1"
                    >
                        <SVGUpload className="h-4 w-4 mr-1" />
                    </ClickableInput>
                </p>
            </div>
            <div className="flex flex-col overflow-y-scroll h-full w-full pr-6">
                {project.isDefaultProject ?
                    <div>No Model</div>
                    :
                    animations.map(a =>
                        <AnimationEntry key={a.identifier} animation={a} selected={tabs.includes(a.identifier)} toggleAnimation={() => {
                            if (tabs.includes(a.identifier)) {
                                setTabs(tabs.filter(t => t !== a.identifier))
                            } else {
                                setTabs([a.identifier].concat(tabs))
                            }
                        }} />)
                }
            </div>
        </div >
    )
}

const AnimationEntry = ({ animation, selected, toggleAnimation }: { animation: DcaAnimation, selected: boolean, toggleAnimation: () => void }) => {

    return (
        <div className={(selected ? "bg-yellow-500" : "bg-gray-700 text-white") + " my-1 rounded-sm h-8 text-left pl-2 w-full flex flex-row ml-2"} onClick={toggleAnimation}>
            <DblClickEditLO obj={animation.name} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full bg-gray-500 text-black" />

            <p className="mr-2 flex flex-row text-white">
                <button className={(selected ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 mr-1"}><SVGDownload className="h-4 w-4" /></button>
                <button className={(selected ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}><SVGCross className="h-4 w-4 group-hover:text-red-500" /></button>
            </p>
        </div>
    )
}

export default ProjectAnimationsWrapper;