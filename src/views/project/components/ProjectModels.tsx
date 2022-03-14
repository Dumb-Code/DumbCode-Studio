import { ContextMenu, ContextMenuTrigger, MenuItem } from "react-contextmenu"
import { Material } from "three"
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter'
import ClickableInput from "../../../components/ClickableInput"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross, SVGDownload, SVGPlus, SVGPushGithub, SVGSave, SVGUpload } from "../../../components/Icons"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useStudio } from "../../../contexts/StudioContext"
import { writeModel } from "../../../studio/formats/model/DCMLoader"
import { DCMCube } from "../../../studio/formats/model/DcmModel"
import DcProject, { createProject, getProjectName, newProject } from "../../../studio/formats/project/DcProject"
import { defaultWritable, FileSystemsAccessApi } from "../../../studio/util/FileTypes"
import { useFileUpload } from "../../../studio/util/FileUploadBox"
import { useListenableObject } from "../../../studio/util/ListenableObject"

const SAVE_AS_CONTEXT = "studio-project-models-save-as"
const modelExtensions = [".dcm", ".tbl", ".bbmodel"]

const ProjectModels = () => {
    const { hasProject, addProject } = useStudio()

    const [ref, isDragging] = useFileUpload<HTMLDivElement>(modelExtensions, file => createProject(file).then(addProject))

    return (
        <div ref={ref} className={`rounded-sm ${isDragging ? 'bg-red-800' : 'dark:bg-gray-800 bg-gray-100'} h-full flex flex-col overflow-hidden`}>
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                <p className="flex-grow mt-1 ml-1">MODELS</p>
                <p className="text-md flex flex-row">
                    <ButtonWithTooltip className="icon-button" onClick={() => addProject(newProject())} tooltip="New Project"><SVGPlus className="h-4 w-4 mr-1" /></ButtonWithTooltip>
                    <ClickableInput
                        onFile={file => createProject(file).then(addProject)}
                        accept={modelExtensions}
                        multiple
                        description="Model Files"
                        className="icon-button"
                        tooltip="Upload a model file"
                    >
                        <SVGUpload className="h-4 w-4 mr-1" />
                    </ClickableInput>
                </p>
            </div>
            <div className="overflow-y-scroll h-full w-full studio-scrollbar">
                <div className="h-0 flex flex-col m-1 mt-2">
                    {hasProject && <ModelEntries />}
                </div>
            </div>
        </div>
    )
}

const ModelEntries = () => {
    const { getSelectedProject, selectProject, projects, removeProject } = useStudio()
    const selectedProject = getSelectedProject()

    return (<>
        {projects.map(project =>
            <ModelEntry
                key={project.identifier}
                project={project}
                selected={project === selectedProject}
                changeModel={() => selectProject(project)}
                removeProject={() => removeProject(project)}
            />
        )}
    </>)
}

const ModelEntry = ({ project, selected, changeModel, removeProject }: { project: DcProject, selected: boolean, changeModel: () => void, removeProject: () => void }) => {
    const [isModelDirty] = useListenableObject(project.model.needsSaving)
    const [isSaveable] = useListenableObject(project.saveableFile)
    const saveModel = async () => {
        try {
            const name = await project.modelWritableFile.write(project.name.value + ".dcm", writeModel(project.model))
            project.name.value = getProjectName(name)
            project.saveableFile.value = true
            project.model.needsSaving.value = false
        } catch (e) {
            console.error(e)
            //Ignore e
        }
    }

    const exportToGLTF = async () => {
        const exporter = new GLTFExporter()
        const oldCubeMaterials = new Map<DCMCube, Material | Material[]>()
        project.model.traverseAll(cube => {
            cube.removeUserData()
            oldCubeMaterials.set(cube, cube.cubeMesh.material)
            cube.cubeMesh.material = project.model.materials.export
        })
        exporter.parse(project.model.modelGroup, value => {
            defaultWritable.write(project.name.value + ".gltf", new Blob([JSON.stringify(value)]))
        }, { includeCustomExtensions: false })
        project.model.traverseAll(cube => {
            cube.setUserData()
            const mats = oldCubeMaterials.get(cube)
            if (mats === undefined) {
                throw new Error("Cube Not Present In Material Map?????")
            }
            cube.cubeMesh.material = mats
        })
    }

    const exportToObj = async () => {
        const exporter = new OBJExporter()
        const value = exporter.parse(project.model.modelGroup)
        defaultWritable.write(project.name.value + ".obj", new Blob([value]))
    }

    const linkedToFile = isSaveable && FileSystemsAccessApi

    const isRemote = false

    const iconButtonClass = (selected ? "bg-sky-600 hover:bg-sky-700" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 text-black dark:text-white")

    return (
        <div>
            <div className={(selected ? "bg-sky-500" : "dark:bg-gray-700 bg-gray-200 text-black dark:text-white") + " mb-2 rounded-sm h-8 text-left pl-2 flex flex-row ml-2"} onClick={changeModel}>
                <DblClickEditLO obj={project.name} disabled={linkedToFile} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full dark:bg-gray-500 text-black" />
                <div className="pt-0 mr-2 text-white flex flex-row">
                    {isRemote &&
                        <ButtonWithTooltip
                            className={iconButtonClass + " rounded pr-1 pl-2 py-0.5 my-0.5 mr-1"}
                            tooltip="Push to Github"
                        >
                            <SVGPushGithub className="h-4 w-4 mr-1" />
                        </ButtonWithTooltip>
                    }
                    {linkedToFile &&
                        <ButtonWithTooltip
                            onClick={e => { saveModel(); e.stopPropagation() }}
                            className={iconButtonClass + " rounded pr-1 pl-2 py-0.5 my-0.5 mr-1 " + (isModelDirty ? " text-red-600 " : "")}
                            tooltip="Save to file"
                        >
                            <SVGSave className="h-4 w-4 mr-1" />
                        </ButtonWithTooltip>
                    }
                    <ContextMenuTrigger id={SAVE_AS_CONTEXT} mouseButton={0}>
                        <ButtonWithTooltip
                            tooltip="Download as"
                            className={iconButtonClass + " rounded pr-1 pl-2 py-0.5 my-0.5 mr-1 " + (isModelDirty ? " text-red-600 " : "")}>
                            <SVGDownload className="h-6 w-4 mr-1" />
                        </ButtonWithTooltip>
                    </ContextMenuTrigger>
                    <ContextMenu id={SAVE_AS_CONTEXT} className="bg-gray-900 rounded">
                        <MenuItem>
                            <div className="p-1 rounded-t w-full bg-gray-700">Download As</div>
                        </MenuItem>
                        <MenuItem
                            onClick={e => { saveModel(); e.stopPropagation() }}
                        >
                            <div className="hover:bg-gray-700 cursor-pointer p-1 rounded w-48 m-1 flex flex-row">
                                <p className="text-gray-300">{project.name.value}</p><p className="text-sky-400 font-bold">.dcm</p>
                            </div>
                        </MenuItem>
                        <MenuItem
                            onClick={e => { exportToObj(); e.stopPropagation() }}
                        >
                            <div className="hover:bg-gray-700 cursor-pointer p-1 rounded w-48 m-1 flex flex-row">
                                <p className="text-gray-300">{project.name.value}</p><p className="text-sky-400 font-bold">.obj</p>
                            </div>
                        </MenuItem>
                        <MenuItem
                            onClick={e => { exportToGLTF(); e.stopPropagation() }}

                        >
                            <div className="hover:bg-gray-700 cursor-pointer p-1 rounded w-48 m-1 flex flex-row">
                                <p className="text-gray-300">{project.name.value}</p><p className="text-sky-400 font-bold">.gltf</p>
                            </div>
                        </MenuItem>
                    </ContextMenu>
                    <ButtonWithTooltip
                        onClick={e => { removeProject(); e.stopPropagation() }}
                        className={iconButtonClass + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}
                        tooltip="Delete"
                    >
                        <SVGCross className="h-4 w-4 group-hover:text-red-500" />
                    </ButtonWithTooltip>
                </div>
            </div>
        </div>
    )
}

export default ProjectModels;