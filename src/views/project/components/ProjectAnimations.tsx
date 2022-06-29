import ClickableInput from "../../../components/ClickableInput"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross, SVGDownload, SVGPlus, SVGSave, SVGUpload } from "../../../components/Icons"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useStudio } from "../../../contexts/StudioContext"
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation"
import { writeDCAAnimation } from "../../../studio/formats/animations/DCALoader"
import DcProject, { getProjectName } from "../../../studio/formats/project/DcProject"
import { downloadBlob, FileSystemsAccessApi, ReadableFile } from "../../../studio/util/FileTypes"
import { useFileUpload } from "../../../studio/util/FileUploadBox"
import { useListenableObject } from "../../../studio/util/ListenableObject"

const animationExtensions = [".dca", ".dcsa"]

const ProjectAnimations = () => {
    const { hasProject, getSelectedProject } = useStudio()

    const addAnimation = (animation: DcaAnimation) => getSelectedProject().animationTabs.addAnimation(animation)

    const uploadFile = (file: ReadableFile) => {
        const project = getSelectedProject()
        project.loadAnimation(file)
    }
    const [ref, isDragging] = useFileUpload<HTMLDivElement>(animationExtensions, uploadFile)

    return (
        <div ref={ref} className={`rounded-sm ${isDragging ? 'bg-red-800' : 'dark:bg-gray-800 bg-gray-100'} h-full flex flex-col overflow-hidden`}>
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                <p className="flex-grow mt-1 ml-1">ANIMATIONS</p>
                <p className="flex flex-row">
                    <ButtonWithTooltip className="icon-button" onClick={() => addAnimation(DcaAnimation.createNew(getSelectedProject()))} tooltip="New Animation"><SVGPlus className="h-4 w-4 mr-1" /></ButtonWithTooltip>
                    <ClickableInput
                        onFile={uploadFile}
                        accept={animationExtensions}
                        multiple
                        description="Animation Files"
                        className="icon-button"
                        tooltip="Upload Animation(s)"
                    >
                        <SVGUpload className="h-4 w-4 mr-1" />
                    </ClickableInput>
                </p>
            </div>
            <div className="overflow-y-scroll h-full w-full studio-scrollbar">
                <div className="h-0 flex flex-col m-1 mt-2">
                    {hasProject && <AnimationEntries project={getSelectedProject()} />}
                </div>
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
    const [isAnimationDirty] = useListenableObject(animation.needsSaving)
    const [isSaveable] = useListenableObject(animation.saveableFile)
    const saveAnimation = async () => {
        if (animation.isSkeleton.value) {
            downloadBlob(animation.name.value + "_skeleton.dcsa", writeDCAAnimation(animation))
            return
        }
        try {
            const name = await animation.animationWritableFile.write(animation.name.value + ".dca", writeDCAAnimation(animation))
            animation.name.value = getProjectName(name)
            animation.saveableFile.value = true
            animation.needsSaving.value = false
        } catch (e) {
            console.error(e)
            //Ignore e
        }
    }

    const saveable = isSaveable && FileSystemsAccessApi
    const DownloadIcon = saveable ? SVGSave : SVGDownload
    return (
        <div>
            <div className={(selected ? "bg-yellow-500" : "dark:bg-gray-700 bg-gray-200 dark:text-white text-black") + " flex-shrink-0 rounded-sm h-8 text-left pl-2 mb-2 flex flex-row ml-2"} onClick={toggleAnimation}>
                <DblClickEditLO obj={animation.name} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full bg-gray-500 text-black" />
                <p className="mr-2 flex flex-row text-white">
                    <ButtonWithTooltip onClick={e => { saveAnimation(); e.stopPropagation() }} className={(selected ? "bg-yellow-600 hover:bg-yellow-700" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 text-black dark:text-white") + " rounded pr-2 pl-2 py-0.5 my-0.5 mr-1 " + (isAnimationDirty ? " text-red-600 " : "")} tooltip={saveable ? "Save" : "Download"}>
                        <DownloadIcon className="h-4 w-4" />
                    </ButtonWithTooltip>
                    <ButtonWithTooltip onClick={e => { removeAnimation(); e.stopPropagation() }} className={(selected ? "bg-yellow-600 hover:bg-yellow-700" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 text-black dark:text-white") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"} tooltip="Delete"><SVGCross className="h-4 w-4 group-hover:text-red-500" /></ButtonWithTooltip>
                </p>
            </div>
        </div>
    )
}

export default ProjectAnimations;