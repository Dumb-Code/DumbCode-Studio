import { Octokit } from "@octokit/rest";
import Image from "next/image";
import { MouseEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import GithubAccountButton from "../../../components/GithubAccountButton";
import { SVGCross, SvgEdit, SVGTrash } from "../../../components/Icons";
import { MinimizeButton } from "../../../components/MinimizeButton";
import { ButtonWithTooltip } from "../../../components/Tooltips";
import { useProjectPageContext } from "../../../contexts/ProjectPageContext";
import { useStudio } from "../../../contexts/StudioContext";
import { useDialogBoxes } from "../../../dialogboxes/DialogBoxes";
import RemoteProjectsDialogBox from "../../../dialogboxes/RemoteProjectsDialogBox";
import RemoteRepositoriesDialogBox from "../../../dialogboxes/RemoteRepositoriesDialogBox";
import DcProject from "../../../studio/formats/project/DcProject";
import { countTotalRequests, loadRemoteProject } from "../../../studio/formats/project/DcRemoteProject";
import DcRemoteRepo, { DcRemoteRepoContentGetterCounter, loadDcRemoteRepo, RemoteProjectEntry, RemoteRepo, remoteRepoEqual, writeStudioRemote } from "../../../studio/formats/project/DcRemoteRepos";
import GithubCommiter from "../../../studio/git/GithubCommiter";
import { useListenableObjectNullable } from "../../../studio/util/ListenableObject";
import { useGithubAccessToken } from "../../../studio/util/LocalStorageHook";
import { removeRecentGithubRemoteProject, useRecentGithubRemoteProjects } from "../../../studio/util/RemoteProjectsManager";

const ProjectRemote = ({ divHeightRef }: { divHeightRef: RefObject<HTMLDivElement> }) => {
    const { remoteSettingsOpen, setRemoteSettingsOpen } = useProjectPageContext()
    const [githubToken] = useGithubAccessToken()

    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-100 flex flex-col overflow-hidden">
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row dark:border-b border-black">
                <p className="flex-grow mt-1 ml-1">REMOTE SETTINGS</p>
                <MinimizeButton active={remoteSettingsOpen} toggle={() => setRemoteSettingsOpen(!remoteSettingsOpen)} />
            </div>
            <div ref={divHeightRef} className={"h-0 flex flex-row overflow-y-hidden"}>

                {githubToken === null ?
                    <ProjectRemoteRequiresAuthentication /> :
                    <ProjectRemoteIsAuthenticated githubToken={githubToken} />
                }
            </div>
        </div>
    )
}

const ProjectRemoteRequiresAuthentication = () => {
    return (
        <div className="w-full flex flex-col items-center">
            <div className="flex flex-col items-center pt-10">
                <span className="text-2xl dark:text-white mt-2 mb-1">Requires Authentication:</span>
                <GithubAccountButton />
            </div>
        </div>
    )
}
const ProjectRemoteIsAuthenticated = ({ githubToken }: { githubToken: string }) => {
    const { selectedRepo: loadedRepo, setSelectedRepo: loadRepo } = useProjectPageContext()

    const dialogBoxes = useDialogBoxes()
    const repos = useRecentGithubRemoteProjects()
    const [selectedRepo, setSelectedRepo] = useState<RemoteRepo | null>(loadedRepo?.repo ?? null)
    const [projects, setProjects] = useListenableObjectNullable(loadedRepo?.projects, [loadedRepo])

    const { projects: openedProjects } = useStudio()

    const zippedProjects = useMemo(() => projects !== undefined && projects.map(project => {
        return {
            project,
            studio: openedProjects.find(p => p.remoteUUID === project.uuid) ?? null
        }
    }), [openedProjects, projects])

    const onRemoteProjectChanged = useCallback((commiter: GithubCommiter, oldEntry: RemoteProjectEntry | undefined, newEntry: RemoteProjectEntry | undefined) => {
        if (projects === undefined || loadedRepo === null) {
            return
        }
        const newProjects = projects.filter(project => project !== oldEntry)
        if (newEntry !== undefined) {
            newProjects.push(newEntry)
        }
        setProjects(newProjects)

        writeStudioRemote(commiter, newProjects)
    }, [projects, loadedRepo, setProjects])

    return (
        <>
            <div className="w-4/12 flex flex-col">
                <div className="dark:bg-gray-800 bg-gray-300 dark:text-gray-400 text-black font-bold text-xs px-1 dark:border-b dark:border-r border-black flex flex-row items-center">
                    <p className="flex-grow my-0.5 ml-1">REMOTE REPOSITORIES</p>
                    <button className="border bg-gray-600 hover:bg-gray-400 p-px" onClick={() => dialogBoxes.setDialogBox(() => <RemoteRepositoriesDialogBox />)} >
                        <SVGCross className="h-3 w-3 transform p-0 rotate-45 -m-px text-white" />
                    </button>
                </div>
                <div className="dark:border-r border-black flex flex-col overflow-y-scroll flex-grow studio-scrollbar">
                    {repos.map((p, i) =>
                        <RepositoryEntry
                            key={i}
                            repo={p}
                            githubToken={githubToken}
                            selected={selectedRepo !== null && remoteRepoEqual(p, selectedRepo)}
                            // contentLoaded={selectedRemote !== null && remoteRepoEqual(selectedRemote.repo, p)}
                            setRemote={() => {
                                loadDcRemoteRepo(githubToken, p).then(p => loadRepo(p))
                                setSelectedRepo(p)
                            }}
                        />)}
                </div>
            </div>
            <div className="flex flex-col flex-grow">
                <div className="dark:bg-gray-800 bg-gray-300 dark:text-gray-400 text-black font-bold text-xs px-1 dark:border-b border-black flex flex-row items-center">
                    <p className="flex-grow my-0.5 ml-1">REMOTE PROJECTS</p>
                    <button disabled={loadedRepo === null} className="border bg-gray-600 hover:bg-gray-400 p-px" onClick={() => dialogBoxes.setDialogBox(() => <RemoteProjectsDialogBox repo={selectedRepo} onCommit={onRemoteProjectChanged} />)} >
                        <SVGCross className="h-3 w-3 transform p-0 rotate-45 -m-px text-white" />
                    </button>
                </div>
                {
                    loadedRepo == null ?
                        <p className="text-xs dark:text-white text-center w-full mt-4">No Remote Repository Selected. Add or pick one to the left of this section.</p>
                    :
                        <div className="flex flex-col overflow-y-scroll pr-2 h-full studio-scrollbar">
                            {loadedRepo !== null && zippedProjects !== false &&
                                zippedProjects.map((project, i) => <ProjectEntry key={i} project={project.project} repo={loadedRepo} linked={project.studio} onRemoteProjectChanged={onRemoteProjectChanged} />)
                            }
                        </div>
                }
            </div>
        </>
    )
}

const RepositoryEntry = ({ repo, selected, setRemote, githubToken }: { repo: RemoteRepo, selected: boolean, setRemote: () => void, githubToken: string }) => {
    const removeRepoEntry = () => removeRecentGithubRemoteProject(repo)

    const [imgSrc, setImgSrc] = useState<string | null>(null)

    useEffect(() => {
        new Octokit({
            auth: githubToken
        }).users.getByUsername({
            username: repo.owner
        }).then(response => setImgSrc(response.data.avatar_url as string)) //Why is response.data.avatar_url unknown?

    }, [githubToken, repo.owner])
    return (
        <div className="py-1 px-2">
            <button
                className={(selected ? "bg-purple-500" : "dark:bg-gray-700 bg-gray-300 dark:text-white text-black") + " rounded-sm text-left flex w-full flex-col relative"}
                onClick={setRemote}
            >
                <div onClick={e => { e.stopPropagation(); removeRepoEntry() }} className="absolute top-0 right-0 text-red-600 hover:text-red-400 ">
                    <SVGTrash className="w-4" />
                </div>
                <div className="flex-grow w-full flex flex-row items-center">
                    <div className="w-8 h-8 m-1 flex justify-center rounded bg-black p-px">{imgSrc !== null && <Image className="rounded" width={32} height={32} src={imgSrc} alt="Avatar" />}</div>
                    <div className="flex-grow">
                        <div className="text-xs truncate">{repo.owner} /</div>
                        <div className="flex-grow flex flex-row w-full">
                            <div className="font-bold transform -mt-2 truncate flex-grow">{repo.repo}</div>
                            {repo.branch !== null && <div className="text-xs pr-1 -mt-0.5 text-gray-200">#{repo.branch}</div>}
                        </div>
                    </div>
                </div>
            </button>
        </div>
    )
}

const ProjectEntry = ({ project, repo, onRemoteProjectChanged, linked }: {
    project: RemoteProjectEntry, repo: DcRemoteRepo, linked: DcProject | null,
    onRemoteProjectChanged: (commiter: GithubCommiter, oldEntry: RemoteProjectEntry | undefined, newEntry: RemoteProjectEntry | undefined) => void,
}) => {
    const { selectProject, addProject } = useStudio()

    const { setDialogBox } = useDialogBoxes()

    const counterRef = useRef<DcRemoteRepoContentGetterCounter | null>(null)

    const [status, setStatus] = useState(-1)

    const fullyLinked = useRef(false)

    const setProject = () => {
        if (linked !== null) {
            selectProject(linked)
            return
        }
        const ref = counterRef.current = repo.createCounter(countTotalRequests(project))
        loadRemoteProject(ref, project).then(p => p !== null && addProject(p))
        setStatus(0)
    }

    useEffect(() => {
        if (linked === null && counterRef.current !== null) {
            const listner = (value: number, total: number) => setStatus(Math.floor(value / total * 100))
            counterRef.current.addListener(listner)
            return () => {
                if (counterRef.current !== null) {
                    counterRef.current.removeListener(listner)
                }
            }
        }
    }, [linked, status])

    if (linked) {
        fullyLinked.current = true
    }

    if (status === 100 && !linked && fullyLinked.current) {
        fullyLinked.current = false
        setStatus(0)
    }

    const effectiveStatus = linked ? 100 : status

    const editRemoteRepo = (e: MouseEvent) => {
        setDialogBox(() => <RemoteProjectsDialogBox editingRemote={project} repo={repo.repo} onCommit={onRemoteProjectChanged} />)
        e.stopPropagation()
    }

    return (
        <div onClick={setProject} className={(effectiveStatus === 100 ? "bg-purple-500" : "dark:bg-gray-700 bg-gray-300 dark:text-white text-black") + " group my-1 rounded-sm h-6 text-left pl-2 flex flex-row ml-4"} >
            <button className="flex-grow truncate text-left">{project.name}</button>

            <div className={(effectiveStatus === 100 || effectiveStatus <= 0) ? "hidden" : "overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 flex-grow mt-2"}>
                <div style={{ width: Math.max(effectiveStatus, 0) + "%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
            </div>

            <div className={(effectiveStatus === 100 ? "bg-purple-300 text-purple-700" : "dark:bg-gray-400 bg-white text-gray-700") + " flex-shrink px-2 rounded-xl text-xs min-w-20 text-center font-bold m-1"}>
                {effectiveStatus === 100 ? "LOADED" : effectiveStatus <= 0 ? "UNLOADED - CLICK TO LOAD" : "LOADING.."}
            </div>
            <ButtonWithTooltip className="dark:hover:text-blue-500 hover:text-blue-200" tooltip="Edit" onClick={editRemoteRepo}>
                <SvgEdit className="w-4 h-4 mr-1 ml-2 text-white opacity-70" />
            </ButtonWithTooltip>
        </div>
    )
}

export default ProjectRemote;