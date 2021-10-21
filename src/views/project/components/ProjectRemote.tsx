import { MouseEventHandler, RefObject, useMemo, useState } from "react";
import { ContextMenu, ContextMenuTrigger } from "react-contextmenu";
import { SVGCross } from "../../../components/Icons"
import { MinimizeButton } from "../../../components/MinimizeButton";

type StoredRepo = {
    token: string
    owner: string
    name: string
    branch: string | null

    // unsyncedEntries: 
}

const CREATE_REMOTE_PROJECTS = "studio-project-remotes-create"


const storageKey = "dumbcode.remoteproject"


const ProjectRemote = ({ remoteShown, showRemote, divHeightRef }: { remoteShown: boolean, showRemote: (val: boolean) => void, divHeightRef: RefObject<HTMLDivElement> }) => {

    const [repos, _setRepos] = useState<readonly StoredRepo[]>(() => {
        const item = localStorage.getItem(storageKey)
        if (item !== null) {
            return JSON.parse(item)
        }
        return []
    })

    const setRepos = (repos: StoredRepo[]) => {
        _setRepos(repos)
        localStorage.setItem(storageKey, JSON.stringify(repos))
    }

    const addRepo = (repo: StoredRepo) => {
        setRepos([...repos, repo])
    }

    const [selectedRepo, setSelectedRepo] = useState<StoredRepo | null>(null)

    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-100 flex flex-col overflow-hidden">
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row dark:border-b border-black">
                <p className="flex-grow mt-1 ml-1">REMOTE SETTINGS</p>
                <MinimizeButton active={remoteShown} toggle={() => showRemote(!remoteShown)} />
            </div>
            <div ref={divHeightRef} className={"h-0 flex flex-row overflow-y-hidden"}>
                <div className="w-4/12 flex flex-col">
                    <div className="dark:bg-gray-800 bg-gray-300 dark:text-gray-400 text-black font-bold text-xs px-1 dark:border-b dark:border-r border-black">
                        <p className="flex-grow my-0.5 ml-1">REMOTE REPOSITORIES</p>
                    </div>
                    <div className="dark:border-r border-black flex flex-col overflow-y-scroll pr-6">
                        {repos.map((r, i) =>
                            <RepositoryEntry key={i} repo={r} selected={r === selectedRepo} selectRemote={() => setSelectedRepo(r)} />
                        )}
                        <ContextMenuTrigger id={CREATE_REMOTE_PROJECTS} mouseButton={0}>
                            <button className="flex flex-row dark:bg-gray-900 bg-gray-300 mx-2 rounded mt-1 mb-6 dark:text-gray-400 text-black w-full">
                                <SVGCross className="h-5 w-5 transform rotate-45 ml-2 mt-0.5 mr-1 text-white" /> Add New Remote Repository
                            </button>
                        </ContextMenuTrigger>
                        <ContextMenu id={CREATE_REMOTE_PROJECTS} className="bg-gray-900 text-white p-3 border-blue-500 border-2">
                            <AddNewRepoContextMenu addRepo={addRepo} />
                        </ContextMenu>
                    </div>
                </div>
                <div className="flex flex-col flex-grow">
                    <div className="dark:bg-gray-800 bg-gray-300 dark:text-gray-400 text-black font-bold text-xs px-1 dark:border-b border-black">
                        <p className="flex-grow my-0.5 ml-3">REMOTE PROJECTS</p>
                    </div>
                    <div className="flex flex-col overflow-y-scroll pr-6 h-full">
                        <ProjectEntry name="T-rex" status={100} setRemote={() => console.log("add project to list")} />
                        <ProjectEntry name="Stegosaurus" status={0} setRemote={() => console.log("add project to list")} />
                        <ProjectEntry name="Trike" status={30} setRemote={() => console.log("add project to list")} />
                        <ProjectEntry name="Velociraptor" status={100} setRemote={() => console.log("add project to list")} />
                        <ProjectEntry name="Mosa" status={50} setRemote={() => console.log("add project to list")} />
                        <ProjectEntry name="Kash's Mom" status={0} setRemote={() => console.log("add project to list")} />
                        <div>
                            <button className="flex flex-row bg-gray-900 mx-4 rounded w-full mt-1 mb-6 text-gray-400">
                                <SVGCross className="h-5 w-5 transform rotate-45 ml-2 mt-0.5 mr-1 text-white" /> Add New Remote Project
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const AddNewRepoContextMenu = ({addRepo}: {addRepo: (repo: StoredRepo) => void}) => {
    const [repoOwner, setRepoOwner] = useState("")
    const [repoName, setRepoName] = useState("")
    const [branch, setBranch] = useState("")

    const isValid = useMemo(() => repoOwner.length !== 0 && repoName.length !== 0, [repoOwner, repoName])

    console.log(isValid)

    const submit: MouseEventHandler<HTMLSpanElement> = event => {
        event.stopPropagation()

        // const repo: StoredRepo = {

        // }
    }

    return ( <>
        <div>
            <span>Repo:</span>
            <input className="p-0 bg-gray-300 text-gray-900 placeholder-gray-500" value={repoOwner} onChange={e => setRepoOwner(e.target.value)} autoComplete="on" type="text" name="dcs_owner" placeholder="Repository Owner" />
            <span>/</span>
            <input className="p-0 bg-gray-300 text-gray-900 placeholder-gray-500" value={repoName} onChange={e => setRepoName(e.target.value)} autoComplete="on" type="text" name="dcs_repo" placeholder="Repository Owner" />
        </div>
        <div>
            <span>Branch:</span>
            <input className="p-0 bg-gray-300 text-gray-900 placeholder-gray-500" value={branch} onChange={e => setBranch(e.target.value)} autoComplete="on" type="text" name="dcs_branch" placeholder="Leave blank for default branch" />
        </div>
        <span className={isValid ? "bg-blue-500" : "bg-red-500"} onClick={submit}>Submit</span>
    </> )
}

const RepositoryEntry = ({ repo, selected, selectRemote: setRemote }: { repo: StoredRepo, selected: boolean, selectRemote: () => void }) => {
    return (
        <button
            className={(selected ? "bg-purple-500" : "dark:bg-gray-700 bg-gray-300 dark:text-white text-black") + " my-1 ml-2 -mr-2 rounded-sm h-10 text-left pl-2 pt-1 flex"}
            onClick={setRemote}
        >
            <p className="text-xs truncate">{repo.owner} /</p>
            <p className="font-bold transform -translate-y-2 truncate flex-grow">{repo.branch}</p>
            {repo.branch !== null && <p className="text-xs text-gray-200">#{repo.branch}</p>}
        </button>
    )
}

const ProjectEntry = ({ name, status, setRemote }: { name: string, status: number, setRemote: () => void }) => {

    return (
        <div className={(status === 100 ? "bg-purple-500" : "dark:bg-gray-700 bg-gray-300 dark:text-white text-black") + " my-1 rounded-sm h-6 text-left pl-2 w-full flex flex-row ml-4"} >
            <button className="flex-grow truncate text-left" onClick={setRemote}>{name}</button>

            <div className={(status === 100 || status === 0) ? "hidden" : "overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 w-40 mt-2"}>
                <div style={{ width: status + "%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
            </div>

            <div className={(status === 100 ? "bg-purple-300 text-purple-700" : "dark:bg-gray-400 bg-white text-gray-700") + " px-2 rounded-xl text-xs w-20 text-center font-bold m-1"}>
                {status === 100 ? "LOADED" : status === 0 ? "UNLOADED" : "LOADING.."}
            </div>
        </div>
    )
}

export default ProjectRemote;