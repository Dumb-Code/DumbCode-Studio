import { RefObject, useState } from "react";
import { SVGCross, SVGTrash } from "../../../components/Icons"
import { MinimizeButton } from "../../../components/MinimizeButton";
import { useStudio } from "../../../contexts/StudioContext";
import { useDialogBoxes } from "../../../dialogboxes/DialogBoxes";
import RemoteProjectsDialogBox from "../../../dialogboxes/RemoteProjectsDialogBox";
import RemoteRepositoriesDialogBox from "../../../dialogboxes/RemoteRepositoriesDialogBox";
import { loadRemoteProject } from "../../../studio/formats/project/DcRemoteProject";
import DcRemoteRepo, { loadDcRemoteRepo, RemoteProjectEntry, RemoteRepo, remoteRepoEqual } from "../../../studio/formats/project/DcRemoteRepos";
import { removeRecentGithubRemoteProject, useRecentGithubRemoteProjects } from "../../../studio/util/RemoteProjectsManager";

const ProjectRemote = ({ remoteShown, showRemote, divHeightRef }: { remoteShown: boolean, showRemote: (val: boolean) => void, divHeightRef: RefObject<HTMLDivElement> }) => {

    const { addProject } = useStudio()

    const dialogBoxes = useDialogBoxes()

    const projects = useRecentGithubRemoteProjects()

    const [selectedRemote, setSelectedRemote] = useState<DcRemoteRepo | null>(null)
    const [selectedRepo, setSelectedRepo] = useState<RemoteRepo | null>(null)

    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-100 flex flex-col overflow-hidden">
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row dark:border-b border-black">
                <p className="flex-grow mt-1 ml-1">REMOTE SETTINGS</p>
                <MinimizeButton active={remoteShown} toggle={() => showRemote(!remoteShown)} />
            </div>
            <div ref={divHeightRef} className={"h-0 flex flex-row overflow-y-hidden"}>
                <div className="w-4/12 flex flex-col">
                    <div className="dark:bg-gray-800 bg-gray-300 dark:text-gray-400 text-black font-bold text-xs px-1 dark:border-b dark:border-r border-black flex flex-row items-center">
                        <p className="flex-grow my-0.5 ml-1">REMOTE REPOSITORIES</p>
                        <button className="border bg-gray-600 hover:bg-gray-400 p-px" onClick={() => dialogBoxes.setDialogBox(() => <RemoteRepositoriesDialogBox />)} >
                            <SVGCross className="h-3 w-3 transform p-0 rotate-45 -m-px text-white" />
                        </button>
                    </div>
                    <div className="dark:border-r border-black flex flex-col overflow-y-scroll flex-grow">
                        {projects.map((p, i) =>
                            <RepositoryEntry
                                key={i}
                                repo={p}
                                selected={selectedRepo !== null && remoteRepoEqual(p, selectedRepo)}
                                // contentLoaded={selectedRemote !== null && remoteRepoEqual(selectedRemote.repo, p)}
                                setRemote={() => {
                                    loadDcRemoteRepo(p).then(p => setSelectedRemote(p))
                                    setSelectedRepo(p)
                                }}
                            />)}
                    </div>
                </div>
                <div className="flex flex-col flex-grow">
                    <div className="dark:bg-gray-800 bg-gray-300 dark:text-gray-400 text-black font-bold text-xs px-1 dark:border-b dark:border-r border-black flex flex-row items-center">
                        <p className="flex-grow my-0.5 ml-1">REMOTE PROJECTS</p>
                        <button className="border bg-gray-600 hover:bg-gray-400 p-px" onClick={() => dialogBoxes.setDialogBox(() => <RemoteProjectsDialogBox />)} >
                            <SVGCross className="h-3 w-3 transform p-0 rotate-45 -m-px text-white" />
                        </button>
                    </div>
                    <div className="flex flex-col overflow-y-scroll pr-2 h-full">
                        {selectedRemote !== null && selectedRepo !== null &&
                            selectedRemote.projects.map((project, i) => <ProjectEntry key={i} project={project} repo={selectedRepo} setProject={() => loadRemoteProject(selectedRemote, project).then(r => r !== null && addProject(r))} />)
                        }
                        {/* <ProjectEntry name="T-rex" status={100} setRemote={() => console.log("add project to list")} />
                        <ProjectEntry name="Stegosaurus" status={0} setRemote={() => console.log("add project to list")} />
                        <ProjectEntry name="Trike" status={30} setRemote={() => console.log("add project to list")} />
                        <ProjectEntry name="Velociraptor" status={100} setRemote={() => console.log("add project to list")} />
                        <ProjectEntry name="Mosa" status={50} setRemote={() => console.log("add project to list")} />
                        <ProjectEntry name="Kash's Mom" status={0} setRemote={() => console.log("add project to list")} /> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

const RepositoryEntry = ({ repo, selected, setRemote }: { repo: RemoteRepo, selected: boolean, setRemote: () => void }) => {
    const removeRepoEntry = () => removeRecentGithubRemoteProject(repo)
    return (
        <div className="py-1 px-2">
            <button
                className={(selected ? "bg-purple-500" : "dark:bg-gray-700 bg-gray-300 dark:text-white text-black") + " rounded-sm text-left flex w-full flex-col relative"}
                onClick={setRemote}
            >
                <div onClick={e => { e.stopPropagation(); removeRepoEntry() }} className="absolute top-0 right-0 text-red-600 hover:text-red-400 ">
                    <SVGTrash className="w-4" />
                </div>
                <div className="text-xs truncate">{repo.owner} /</div>
                <div className="flex-grow flex flex-row w-full">
                    <div className="font-bold transform -mt-2 truncate flex-grow">{repo.repo}</div>
                    {repo.branch !== null && <div className="text-xs pr-1 -mt-0.5 text-gray-200">#{repo.branch}</div>}
                </div>
            </button>
        </div>
    )
}

const ProjectEntry = ({ project, repo, setProject }: { project: RemoteProjectEntry, repo: RemoteRepo, setProject: () => void }) => {
    //TODO: this
    const [status, setStatus] = useState(0)
    if (setStatus as any) { } //ts ignore
    return (
        <div onClick={setProject} className={(status === 100 ? "bg-purple-500" : "dark:bg-gray-700 bg-gray-300 dark:text-white text-black") + " my-1 rounded-sm h-6 text-left pl-2 flex flex-row ml-4"} >
            <button className="flex-grow truncate text-left">{project.name}</button>

            <div className={(status === 100 || status === 0) ? "hidden" : "overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 flex-grow mt-2"}>
                <div style={{ width: status + "%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
            </div>

            <div className={(status === 100 ? "bg-purple-300 text-purple-700" : "dark:bg-gray-400 bg-white text-gray-700") + " flex-shrink px-2 rounded-xl text-xs w-20 text-center font-bold m-1"}>
                {status === 100 ? "LOADED" : status === 0 ? "UNLOADED" : "LOADING.."}
            </div>
        </div>
    )
}

export default ProjectRemote;