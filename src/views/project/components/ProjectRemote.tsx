import { SVGCross } from "../../../components/Icons"
import { MinimizeButton } from "../../../components/MinimizeButton";

const ProjectRemote = ({remoteShown, showRemote}: {remoteShown: boolean, showRemote: (boolean) => void}) => {

    return(
        <div className="rounded-sm bg-gray-800 flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1 flex flex-row border-b border-black">
                <p className="flex-grow mt-1 ml-1">REMOTE SETTINGS</p>
                <MinimizeButton active={remoteShown} toggle={() => showRemote(!remoteShown)}/>
            </div>
            <div className="flex flex-row overflow-y-hidden transition-height transform duration-200 ease-in-out">
                <div className="w-4/12 flex flex-col">
                    <div className="bg-gray-800 text-gray-400 font-bold text-xs px-1 border-b border-r border-black">
                        <p className="flex-grow my-0.5 ml-1">REMOTE REPOSITORIES</p>
                    </div>
                    <div className="border-r border-black flex flex-col overflow-y-scroll pr-6">
                        <RepositoryEntry org="DumbCode" repo="Project: Nublar" selected={true} setRemote={ () => console.log("set remote") } />
                        <RepositoryEntry org="DumbCode" repo="TODM" selected={false} setRemote={ () => console.log("set remote") } />
                        <RepositoryEntry org="DumbCode" repo="Kash's Mom" selected={false} setRemote={ () => console.log("set remote") } />
                        <div>
                            <button className="flex flex-row bg-gray-900 mx-2 rounded mt-1 mb-6 text-gray-400 w-full">
                                <SVGCross className="h-5 w-5 transform rotate-45 ml-2 mt-0.5 mr-1 text-white" /> Add New Remote Repository
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col flex-grow">
                    <div className="bg-gray-800 text-gray-400 font-bold text-xs px-1 border-b border-black">
                        <p className="flex-grow my-0.5 ml-3">REMOTE PROJECTS</p>
                    </div>
                    <div className="flex flex-col overflow-y-scroll pr-6 h-full">
                        <ProjectEntry name="T-rex" status={100} setRemote={ () => console.log("add project to list")}/>
                        <ProjectEntry name="Stegosaurus" status={0} setRemote={ () => console.log("add project to list")}/>
                        <ProjectEntry name="Trike" status={30} setRemote={ () => console.log("add project to list")}/>
                        <ProjectEntry name="Velociraptor" status={100} setRemote={ () => console.log("add project to list")}/>
                        <ProjectEntry name="Mosa" status={50} setRemote={ () => console.log("add project to list")}/>
                        <ProjectEntry name="Kash's Mom" status={0} setRemote={ () => console.log("add project to list")}/>
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

const RepositoryEntry = ({org, repo, selected, setRemote}: {org: string, repo: string, selected: boolean, setRemote: () => void}) => {
    
    return(
        <button 
            className={(selected ? "bg-purple-500" : "bg-gray-700 text-white") + " my-1 ml-2 -mr-2 rounded-sm h-10 text-left pl-2 pt-1"}
            onClick={setRemote}
        >
            <p className="text-xs truncate">{org} /</p>
            <p className="font-bold transform -translate-y-2 truncate">{repo}</p>
        </button>
    )
}

const ProjectEntry = ({name, status, setRemote}: {name: string, status: number, setRemote: () => void}) => {

    return(
        <div className={(status === 100 ? "bg-purple-500" : "bg-gray-700 text-white") + " my-1 rounded-sm h-6 text-left pl-2 w-full flex flex-row ml-4"} >
            <button className="flex-grow truncate text-left" onClick={setRemote}>{name}</button>
            
            <div className={(status === 100 || status === 0) ? "hidden" : "overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 w-40 mt-2"}>
                <div style={{ width: status+"%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
            </div>

            <div className={(status === 100 ? "bg-purple-300 text-purple-700" : "bg-gray-400 text-gray-700") + " px-2 rounded-xl text-xs w-20 text-center font-bold m-1"}>
                {status === 100 ? "LOADED" : status === 0 ? "UNLOADED" : "LOADING.."}
            </div>
        </div>
    )
}

export default ProjectRemote;