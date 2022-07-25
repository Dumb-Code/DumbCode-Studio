import { useCallback } from "react"
import ClickableInput from "../../../components/ClickableInput"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross, SVGDownload, SVGPlus, SVGSave, SVGUpload } from "../../../components/Icons"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useStudio } from "../../../contexts/StudioContext"
import { useToast } from "../../../contexts/ToastContext"
import { useDialogBoxes } from "../../../dialogboxes/DialogBoxes"
import ExportAnimationAsGifDialogBox from "../../../dialogboxes/ExportAnimationAsGifDialogBox"
import { downloadBlob, FileSystemsAccessApi, ReadableFile } from "../../../studio/files/FileTypes"
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation"
import { writeDCAAnimation } from "../../../studio/formats/animations/DCALoader"
import DcProject, { removeFileExtension } from "../../../studio/formats/project/DcProject"
import { useListenableObject } from "../../../studio/listenableobject/ListenableObject"
import DownloadAsButton, { DownloadOption } from "./DownloadAsButton"
import { BasicProjectFileArea } from "./ProjectFileArea"

const SAVE_AS_CONTEXT = "studio-project-animations-save-as"
const animationExtensions = [".dca", ".dcsa"]

const ProjectAnimations = () => {
    const { hasProject, getSelectedProject } = useStudio()

    const addAnimation = (animation: DcaAnimation) => getSelectedProject().animationTabs.addAnimation(animation)

    const uploadFile = (file: ReadableFile) => {
        const project = getSelectedProject()
        project.loadAnimation(file)
    }
    return (
        <BasicProjectFileArea
            extensions={animationExtensions}
            onChange={uploadFile}
            title="Animations"
            buttons={
                <>
                    <ButtonWithTooltip className="icon-button" onClick={() => addAnimation(DcaAnimation.createNew(getSelectedProject()))} tooltip="New Animation">
                        <SVGPlus className="h-4 w-4 mr-1" />
                    </ButtonWithTooltip>
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
                </>
            }
        >
            {hasProject && <AnimationEntries project={getSelectedProject()} />}
        </BasicProjectFileArea>
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
    const [isSkeleton] = useListenableObject(animation.isSkeleton)

    const { addToast } = useToast()

    const saveAnimation = async () => {
        if (animation.isSkeleton.value) {
            downloadBlob(animation.name.value + "_skeleton.dcsa", writeDCAAnimation(animation))
            return
        }
        try {
            const name = await animation.animationWritableFile.write(animation.name.value + ".dca", writeDCAAnimation(animation))
            animation.name.value = removeFileExtension(name)
            animation.saveableFile.value = true
            animation.needsSaving.value = false
            addToast(`Saved animation as ${name}`, "success")
        } catch (e) {
            console.error(e)
            //Ignore e
        }
    }

    const dialogBoxes = useDialogBoxes()
    const exportAsGif = useCallback(() => {
        dialogBoxes.setDialogBox(() => <ExportAnimationAsGifDialogBox animation={animation} />)
    }, [animation, dialogBoxes])

    const saveable = !isSkeleton && isSaveable && FileSystemsAccessApi
    const iconButtonClass = (selected ? "bg-yellow-600 hover:bg-yellow-700" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 text-black dark:text-white") + " rounded pr-2 pl-2 py-0.5 my-0.5"
    return (
        <div>
            <div className={(selected ? "bg-yellow-500" : "dark:bg-gray-700 bg-gray-200 dark:text-white text-black") + " flex-shrink-0 rounded-sm h-8 text-left pl-2 mb-2 flex flex-row ml-2"} onClick={toggleAnimation}>
                <DblClickEditLO obj={animation.name} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full bg-gray-500 text-black" />
                <div className="mr-2 flex flex-row text-white">
                    {isSaveable && (
                        <ButtonWithTooltip onClick={e => { saveAnimation(); e.stopPropagation() }} className={iconButtonClass + " mr-1 " + (isAnimationDirty ? " text-red-600 " : "")} tooltip={saveable ? "Save" : "Download"}>
                            <SVGSave className="h-4 w-4" />
                        </ButtonWithTooltip>
                    )}

                    <DownloadAsButton
                        Icon={SVGDownload}
                        tooltip="Download As"
                        iconButtonClass={iconButtonClass + " rounded pr-1 pl-2 py-0.5 my-0.5 mr-1 " + (isAnimationDirty ? " text-red-600 " : "")}
                        menuId={SAVE_AS_CONTEXT}
                        name={animation.name.value}
                    >
                        <DownloadOption exportFunction={saveAnimation} extension="dca" />
                        <DownloadOption exportFunction={exportAsGif} extension="gif" />
                    </DownloadAsButton>
                    <ButtonWithTooltip onClick={e => { removeAnimation(); e.stopPropagation() }} className={iconButtonClass + " group"} tooltip="Delete"><SVGCross className="h-4 w-4 group-hover:text-red-500" /></ButtonWithTooltip>
                </div>
            </div>
        </div>
    )
}

export default ProjectAnimations;