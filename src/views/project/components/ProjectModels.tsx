import { AnimationClip, KeyframeTrack, Material } from "three"
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter'
import ClickableInput from "../../../components/ClickableInput"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross, SVGDownload, SVGPlus, SVGPushGithub, SVGSave, SVGUpload } from "../../../components/Icons"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useStudio } from "../../../contexts/StudioContext"
import { useDialogBoxes } from "../../../dialogboxes/DialogBoxes"
import PushToGithubDialogBox from "../../../dialogboxes/PushToGithubDialogBox"
import { defaultWritable, downloadBlob, FileSystemsAccessApi } from "../../../studio/files/FileTypes"
import { useFileUpload } from "../../../studio/files/FileUploadBox"
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation"
import { writeModel } from "../../../studio/formats/model/DCMLoader"
import { DCMCube } from "../../../studio/formats/model/DcmModel"
import { writeOldModel } from "../../../studio/formats/model/OldDCMLoader"
import { exportAsBBModel } from "../../../studio/formats/project/BBModelExporter"
import DcProject, { createProject, newProject, removeFileExtension } from "../../../studio/formats/project/DcProject"
import { writeDcProj } from "../../../studio/formats/project/DcProjectLoader"
import { useListenableObject } from "../../../studio/util/ListenableObject"
import { NumArray } from "../../../studio/util/NumArray"
import DownloadAsButton, { DownloadOption } from "./DownloadAsButton"

const SAVE_AS_CONTEXT = "studio-project-models-save-as"
const modelExtensions = [".dcm", ".tbl", ".bbmodel", ".dcproj"]

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
                        description="Model/Project File"
                        className="icon-button"
                        tooltip="Upload a model or project file"
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
    const [isProjectDirty, setIsProjectDirty] = useListenableObject(project.projectNeedsSaving)
    const [isModelDirty, setIsModelDirty] = useListenableObject(project.model.needsSaving)
    const [saveType, setSaveType] = useListenableObject(project.projectSaveType)

    const dialogBoxes = useDialogBoxes()

    const saveModel = async (type = saveType) => {
        try {
            if (type === "model") {
                const name = await project.modelWritableFile.write(project.name.value + ".dcm", writeModel(project.model))
                project.name.value = removeFileExtension(name)
                setSaveType(type)
                setIsModelDirty(false)
            } else if (type === "project") {
                const name = await project.projectWritableFile.write(project.name.value + ".dcproj", await writeDcProj(project))
                project.name.value = removeFileExtension(name)
                setSaveType(type)
                setIsProjectDirty(false)
                setIsModelDirty(false)
            }

        } catch (e) {
            console.error(e)
            //Ignore e
        }
    }

    const exportToOldDCM = async () => {
        downloadBlob(project.name.value + ".dcm", writeOldModel(project.model))
    }

    const exportToGLTF = async () => {

        const exportAnimationToGlTFClip = (animation: DcaAnimation): AnimationClip | null => {
            type ClipData<Val extends 3 | 4 = 3> = {
                time: number,
                value: NumArray<Val>
            }

            const position = new Map<string, ClipData[]>()
            const rotation = new Map<string, ClipData<4>[]>()

            const cgGroupPosition = new Map<string, ClipData[]>()
            const cgMeshScale = new Map<string, ClipData[]>()

            const getAllCubesFor = (name: string) => {
                const set = project.model.cubeMap.get(name)
                if (!set) return []
                return Array.from(set)
            }

            animation.keyframes.value.forEach(kf => {
                for (const pp of kf.progressionPoints.value) {
                    animation.project.model.resetVisuals()
                    const time = kf.startTime.value + kf.duration.value * pp.x

                    console.log(time, pp.x)
                    animation.animateAt(time, true)

                    kf.position.forEach((_, name) => getAllCubesFor(name).forEach(cube => {
                        const group = cube.cubeGroup
                        const pos = group.position

                        const data = position.get(group.uuid) ?? []
                        data.push({ time, value: [pos.x, pos.y, pos.z] })
                        position.set(group.uuid, data)
                    }))

                    kf.rotation.forEach((_, name) => getAllCubesFor(name).forEach(cube => {
                        const group = cube.cubeGroup
                        const rot = group.quaternion

                        const data = rotation.get(group.uuid) ?? []
                        data.push({ time, value: [rot.x, rot.y, rot.z, rot.w] })
                        rotation.set(group.uuid, data)
                    }))

                    kf.cubeGrow.forEach((_, name) => getAllCubesFor(name).forEach(cube => {
                        const { cubeGrowGroup, cubeMesh } = cube

                        const groupPosition = cubeGrowGroup.position
                        const meshScale = cubeMesh.scale

                        const positionData = cgGroupPosition.get(cubeGrowGroup.uuid) ?? []
                        positionData.push({ time, value: [groupPosition.x, groupPosition.y, groupPosition.z] })
                        cgGroupPosition.set(cubeGrowGroup.uuid, positionData)

                        const meshScaleData = cgMeshScale.get(cubeMesh.uuid) ?? []
                        meshScaleData.push({ time, value: [meshScale.x, meshScale.y, meshScale.z] })
                        cgMeshScale.set(cubeMesh.uuid, meshScaleData)
                    }))

                }
            })



            const compressClipMap = <V extends 3 | 4,>(map: Map<string, ClipData<V>[]>, name: string): KeyframeTrack[] => {
                const result: KeyframeTrack[] = []

                for (const [key, values] of map) {
                    const times = values.map(t => t.time)
                    const data = values.flatMap(t => t.value)
                    result.push(new KeyframeTrack(`${key}.${name}`, times, data))
                }

                return result
            }


            const keyframes = ([] as KeyframeTrack[])
                .concat(compressClipMap(position, "position"))
                .concat(compressClipMap(rotation, "quaternion"))
                .concat(compressClipMap(cgGroupPosition, "position"))
                .concat(compressClipMap(cgMeshScale, "scale"))

            project.model.resetVisuals()
            return new AnimationClip(animation.name.value, animation.maxTime.value, keyframes)
        }


        const exporter = new GLTFExporter()
        const oldCubeMaterials = new Map<DCMCube, Material | Material[]>()
        project.model.traverseAll(cube => {
            cube.removeUserData()
            oldCubeMaterials.set(cube, cube.cubeMesh.material)
            cube.cubeMesh.material = project.model.materials.export
        })
        exporter.parse(project.model.modelGroup,
            value => { defaultWritable.write(project.name.value + ".gltf", new Blob([JSON.stringify(value)])) },
            er => console.warn("Error Parsing: " + er),
            {
                includeCustomExtensions: false,
                animations: project.animationTabs.animations.value.map(anim => exportAnimationToGlTFClip(anim)).filter((anim): anim is AnimationClip => anim !== null),
            })
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

    const exportToBBModel = async () => {
        const blob = exportAsBBModel(project)
        defaultWritable.write(project.name.value + ".bbmodel", blob)
    }

    const linkedToFile = saveType !== "unknown" && FileSystemsAccessApi

    const isRemote = project.remoteLink !== undefined

    const iconButtonClass = (selected ? "bg-sky-600 hover:bg-sky-700" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400")

    return (
        <div>
            <div className={(selected ? "bg-sky-500" : "dark:bg-gray-700 bg-gray-200 text-black dark:text-white") + " mb-2 rounded-sm h-8 text-left pl-2 flex flex-row ml-2"} onClick={changeModel}>
                <DblClickEditLO obj={project.name} disabled={linkedToFile} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full dark:bg-gray-500 text-black" />
                <div className="pt-0 mr-2 text-white flex flex-row">
                    {isRemote &&
                        <ButtonWithTooltip
                            onClick={e => { dialogBoxes.setDialogBox(() => <PushToGithubDialogBox project={project} />) }}
                            className={iconButtonClass + " rounded pr-1 pl-2 py-0.5 my-0.5 mr-1" + (isProjectDirty ? " text-red-600 " : "")}
                            tooltip="Push to Github"
                        >
                            <SVGPushGithub className="h-4 w-4 mr-1" />
                        </ButtonWithTooltip>
                    }
                    {linkedToFile &&
                        <ButtonWithTooltip
                            onClick={e => { saveModel(); e.stopPropagation() }}
                            className={iconButtonClass + " rounded pr-1 pl-2 py-0.5 my-0.5 mr-1 " + ((saveType === "project" ? isProjectDirty : isModelDirty) ? " text-red-600 " : "")}
                            tooltip="Save to file"
                        >
                            <SVGSave className="h-4 w-4 mr-1" />
                        </ButtonWithTooltip>
                    }
                    <DownloadAsButton
                        Icon={SVGDownload}
                        tooltip="Download As"
                        iconButtonClass={iconButtonClass + " rounded pr-1 pl-2 py-0.5 my-0.5 mr-1 " + (isModelDirty ? " text-red-600 " : "")}
                        menuId={SAVE_AS_CONTEXT}
                        name={project.name.value}
                    >
                        <DownloadOption exportFunction={() => saveModel("model")} extension="dcm" />
                        <DownloadOption exportFunction={exportToOldDCM} extension="dcm (old)" />
                        <DownloadOption exportFunction={exportToObj} extension="obj" />
                        <DownloadOption exportFunction={exportToGLTF} extension="gltf" />
                        <DownloadOption exportFunction={() => saveModel("project")} extension="dcproj" />
                        <DownloadOption exportFunction={exportToBBModel} extension="bbmodel" />
                    </DownloadAsButton>
                    <ButtonWithTooltip
                        onClick={e => { removeProject(); e.stopPropagation() }}
                        className={iconButtonClass + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}
                        tooltip="Delete"
                    >
                        <SVGCross className="h-4 w-4 group-hover:text-red-500" />
                    </ButtonWithTooltip>
                </div>
            </div>
        </div >
    )
}

export default ProjectModels;