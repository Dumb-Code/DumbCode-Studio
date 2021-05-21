import ClickableInput from "../../../components/ClickableInput"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross, SVGDownload, SVGGrid, SVGPlus, SVGPushGithub, SVGSave, SVGUpload } from "../../../components/Icons"
import { useStudio } from "../../../contexts/StudioContext"
import DcProject, { createProject, getProjectName, newProject } from "../../../studio/formats/DcProject"
import { writeModel } from "../../../studio/formats/model/DCMLoader"
import { FileSystemsAccessApi, defaultWritable } from "../../../studio/util/FileTypes"
import { useFileUpload } from "../../../studio/util/FileUploadBox"
import { useListenableObject } from "../../../studio/util/ListenableObject"
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';

const modelExtensions = [".dcm", ".tbl", ".bbmodel"]

const ProjectModels = () => {
    const { hasProject, addProject } = useStudio()

    const [ref, isDragging] = useFileUpload<HTMLDivElement>(modelExtensions, file => createProject(file).then(addProject))

    return (
        <div ref={ref} className={`rounded-sm ${isDragging ? 'bg-red-800' : 'bg-gray-800'} h-full flex flex-col overflow-hidden`}>
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1 flex flex-row">
                <p className="flex-grow mt-1 ml-1">MODELS</p>
                <p className="text-md flex flex-row">
                    <button className="icon-button" onClick={() => addProject(newProject())}><SVGPlus className="h-4 w-4 mr-1" /></button>
                    <ClickableInput
                        onFile={file => createProject(file).then(addProject)}
                        accept={modelExtensions}
                        multiple
                        description="Model Files"
                        className="icon-button"
                    >
                        <SVGUpload className="h-4 w-4 mr-1" />
                    </ClickableInput>
                </p>
            </div>
            <div className="flex flex-col overflow-y-scroll h-full w-full pr-6">
                {hasProject && <ModelEntries />}
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
            const name = await project.modelWritableFile.write(project.name.value + ".dcm", writeModel(project.model).getAsBlob())
            project.name.value = getProjectName(name)
            project.saveableFile.value = true
            project.model.needsSaving.value = false
        } catch (e) {
            console.error(e)
            //Ignore e
        }
    }

    const exportToObj = async () => {
        const exporter = new OBJExporter()
        const value = exporter.parse(project.model.modelGroup)
        defaultWritable.write(project.name.value + ".obj", new Blob([value]))
    }

    const linkedToFile = isSaveable && FileSystemsAccessApi
    const SaveIcon = linkedToFile ? SVGSave : SVGDownload

    const isRemote = false

    const iconButtonClass = (selected ? "bg-lightBlue-600 hover:bg-lightBlue-700" : "bg-gray-800 hover:bg-gray-900")

    return (
        <div className={(selected ? "bg-lightBlue-500" : "bg-gray-700 text-white") + " my-1 rounded-sm h-8 text-left pl-2 w-full flex flex-row ml-2"} onClick={changeModel}>
            <DblClickEditLO obj={project.name} disabled={linkedToFile} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full bg-gray-500 text-black" />

            <p className="pt-0 mr-2 text-white flex flex-row">
                {isRemote &&
                    <button
                        className={iconButtonClass + " rounded pr-1 pl-2 py-0.5 my-0.5 mr-1"}>
                        <SVGPushGithub className="h-4 w-4 mr-1" />
                    </button>
                }
                <button
                    onClick={e => { exportToObj(); e.stopPropagation() }}
                    className={iconButtonClass + " rounded pr-1 pl-2 py-0.5 my-0.5 mr-1"}>
                    <SVGGrid className="h-4 w-4 mr-1" />
                </button>
                <button
                    onClick={e => { saveModel(); e.stopPropagation() }}
                    className={iconButtonClass + " rounded pr-1 pl-2 py-0.5 my-0.5 mr-1 " + (isModelDirty ? " text-red-600 " : "")}>
                    <SaveIcon className="h-4 w-4 mr-1" />
                </button>
                <button
                    onClick={e => { removeProject(); e.stopPropagation() }}
                    className={iconButtonClass + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}>
                    <SVGCross className="h-4 w-4 group-hover:text-red-500" />
                </button>
            </p>
        </div>
    )
}

export default ProjectModels;