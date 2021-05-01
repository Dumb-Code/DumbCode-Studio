const ProjectRemote = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-2 flex flex-row">
                <p className="flex-grow">REMOTE PROJECTS</p>
                <p className="text-md">add new icon</p>
            </div>
            <div className="flex flex-row h-5/6">
                <div className="w-4/12 border-r border-black flex flex-col overflow-y-scroll h-full">
                    <RemoteEntry org="DumbCode" repo="Project: Nublar" selected={true} setRemote={ () => console.log("set remote") } />
                    <RemoteEntry org="DumbCode" repo="TODM" selected={false} setRemote={ () => console.log("set remote") } />
                    <RemoteEntry org="DumbCode" repo="Kash's Mom" selected={false} setRemote={ () => console.log("set remote") } />
                </div>
                <div className="flex-grow flex flex-col overflow-y-scroll h-full pr-6">
                    <ProjectEntry name="T-rex" status={100} setRemote={ () => console.log("add project to list")}/>
                    <ProjectEntry name="Stegosaurus" status={0} setRemote={ () => console.log("add project to list")}/>
                    <ProjectEntry name="Trike" status={30} setRemote={ () => console.log("add project to list")}/>
                    <ProjectEntry name="Velociraptor" status={100} setRemote={ () => console.log("add project to list")}/>
                    <ProjectEntry name="Mosa" status={50} setRemote={ () => console.log("add project to list")}/>
                    <ProjectEntry name="Kash's Mom" status={0} setRemote={ () => console.log("add project to list")}/>
                </div>
            </div>
        </div>
    )
}

const RemoteEntry = ({org, repo, selected, setRemote}: {org: string, repo: string, selected: boolean, setRemote: () => void}) => {
    return(
        <button 
            className={(selected ? "bg-lightBlue-500" : "bg-gray-700") + " my-1 mx-2 rounded-sm h-10 text-left pl-2 pt-1"}
            onClick={setRemote}
        >
            <p className="text-xs">{org} /</p>
            <p className="font-bold transform -translate-y-2">{repo}</p>
        </button>
    )
}

const ProjectEntry = ({name, status, setRemote}: {name: string, status: number, setRemote: () => void}) => {

    return(
        <button
            className={(status === 100 ? "bg-lightBlue-500" : "bg-gray-700") + " my-1 rounded-sm h-6 text-left pl-2 flex-grow w-full flex flex-row ml-4"}
            onClick={setRemote}
        >
            <p className="flex-grow">{name}</p>
            
            <div className={(status === 100 || status === 0) ? "hidden" : "overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-400 w-40 mt-2"}>
                <div style={{ width: status+"%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-lightBlue-300"></div>
            </div>

            <div className={(status === 100 ? "bg-lightBlue-300 text-lightBlue-700" : "bg-gray-400 text-gray-700") + " px-2 rounded-xl text-xs w-20 text-center font-bold m-1"}>
                {status === 100 ? "LOADED" : status === 0 ? "UNLOADED" : "LOADING.."}
            </div>
        </button>
    )
}

export default ProjectRemote;