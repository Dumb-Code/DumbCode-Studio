import { SVGEye, SVGLocked } from "../../../components/Icons";

const TexturerLayers = () => {
    return(
        <div className="rounded-sm bg-gray-800 flex flex-col overflow-hidden h-full">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1">
                <p className="my-0.5 flex-grow">TEXTURE LAYERS</p>
            </div>
            <div className="h-full overflow-y-scroll pr-2">
                <TexturerLayer name="Some Texture" selected={false} />
                <TexturerLayer name="Some Texture" selected={false} />
                <TexturerLayer name="Some Texture" selected={true} />
                <TexturerLayer name="Some Texture" selected={false} />
                <TexturerLayer name="Some Texture" selected={false} />
                <TexturerLayer name="Some Texture" selected={false} />
                <TexturerLayer name="Some Texture" selected={false} />
            </div>
        </div>
    )
}

const TexturerLayer = ({name, selected}: {name: string, selected: boolean}) => {

    return(
        <div className={(selected ? "bg-lightBlue-500" : "bg-gray-700 text-white") + " my-1 rounded-sm h-8 text-left pl-2 w-full flex flex-row ml-1"} >
            <button className="flex-grow truncate text-left">{name}</button>
            
            <p className="mr-2 flex flex-row text-white">
                <button className={(selected ? "bg-lightBlue-600 hover:bg-lightBlue-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 mr-1"}><SVGEye className="h-4 w-4" /></button>
                <button className={(selected ? "bg-lightBlue-600 hover:bg-lightBlue-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}><SVGLocked className="h-4 w-4 group-hover:text-red-500" /></button>
            </p>
        </div>
    )
}

export default TexturerLayers;