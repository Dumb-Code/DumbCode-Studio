import StudioCanvas from "../../../components/StudioCanvas"
import { useState } from "react"

export const TexturerViewport = () => {

    //Can be "model", "map", or "both"
    const [viewMode, setViewMode] = useState("both")

    return (
        <div className="w-full h-full">
            {viewMode === "both" ? <TexturerBothWindows setStateWith={setViewMode} /> : viewMode === "model" ? <TexturerModelWindow setStateWith={setViewMode} /> : <TexturerTextureWindow setStateWith={setViewMode} />}
        </div>
    )
}

const TexturerTextureWindow = ({ setStateWith }: { setStateWith: any }) => {

    return (
        <div className="h-full w-full dark:bg-gray-700 bg-gray-200">
            <button className="dark:bg-gray-900 bg-gray-300 absolute z-10 w-20 rounded-br dark:text-gray-400 text-black pr-1" onDoubleClick={() => { setStateWith("both") }}>Texture</button>
            <br /><br /><br />
            <p className="ml-16">putTextureMapHere</p>
        </div>
    )
}

const TexturerModelWindow = ({ setStateWith }: { setStateWith: any }) => {

    return (
        <div className="h-full w-full dark:border-black border-white border-b">
            <button className="dark:bg-gray-900 bg-gray-300 absolute z-10 w-20 rounded-br dark:text-gray-400 text-black pr-1" onDoubleClick={() => { setStateWith("both") }}>Model</button>
            <StudioCanvas />
        </div>
    )
}

const TexturerBothWindows = ({ setStateWith }: { setStateWith: any }) => {

    return (
        <div className="flex flex-row h-full">
            <div className="w-1/2 border-r dark:border-black border-white border-b">
                <button className="dark:bg-gray-900 bg-gray-300 absolute z-10 w-20 rounded-br dark:text-gray-400 text-black pr-1" onDoubleClick={() => { setStateWith("model") }}>Model</button>
                <StudioCanvas />
            </div>
            <div className=" dark:bg-gray-700 bg-gray-200 w-1/2 border-l dark:border-black border-white">
                <button className="dark:bg-gray-900 bg-gray-300 absolute z-10 w-20 rounded-br dark:text-gray-400 text-black pr-1" onDoubleClick={() => { setStateWith("texture") }}>Texture</button>
                <br /><br /><br />
                <p className="ml-16">putTextureMapHere</p>
            </div>
        </div>
    )
}