import StudioCanvas from "../../../components/StudioCanvas"
import { useState } from "react"

export const TexturerViewport = () => {

    //Can be "model", "map", or "both"
    const[viewMode, setViewMode] = useState("both")

    return(
        <div className="w-full h-full">
            {viewMode === "both" ? <TexturerBothWindows setStateWith={setViewMode}  /> : viewMode === "model" ? <TexturerModelWindow setStateWith={setViewMode} /> : <TexturerTextureWindow setStateWith={setViewMode} />}
        </div>
    )
}

const TexturerTextureWindow = ({setStateWith}: {setStateWith: any}) => {

    return(
        <div className="h-full w-full bg-gray-700">
            <button className="bg-gray-900 absolute z-10 w-20 rounded-br text-gray-400 pr-1" onDoubleClick={() => {setStateWith("both")}}>Texture</button>
            <br /><br /><br />
            <p className="ml-16">putTextureMapHere</p>
        </div>
    )
}

const TexturerModelWindow = ({setStateWith}: {setStateWith: any}) => {

    return(
        <div className="h-full w-full border-black border-b">
            <button className="bg-gray-900 absolute z-10 w-20 rounded-br text-gray-400 pr-1" onDoubleClick={() => {setStateWith("both")}}>Model</button>
            <StudioCanvas />
        </div>
    )
}

const TexturerBothWindows = ({setStateWith}: {setStateWith: any}) => {

    return(
        <div className="flex flex-row h-full">
            <div className="w-1/2 border-r border-black border-b">
                <button className="bg-gray-900 absolute z-10 w-20 rounded-br text-gray-400 pr-1" onDoubleClick={() => {setStateWith("model")}}>Model</button>
                <StudioCanvas />
            </div>
            <div className="bg-gray-700 w-1/2 border-l border-black">
                <button className="bg-gray-900 absolute z-10 w-20 rounded-br text-gray-400 pr-1" onDoubleClick={() => {setStateWith("texture")}}>Texture</button>
                <br /><br /><br />
                <p className="ml-16">putTextureMapHere</p>
            </div>
        </div>
    )
}