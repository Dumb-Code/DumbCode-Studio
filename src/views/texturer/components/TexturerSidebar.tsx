import Dropdown, { DropdownItem } from "../../../components/Dropdown";
import { SVGEye, SVGLocked } from "../../../components/Icons";

const TexturerSidebar = () => {
    return (
        <div className="dark:bg-gray-800 bg-gray-200 flex flex-col overflow-hidden h-full">
            <TexturerLayers />
        </div>
    )
}

const TexturerLayers = () => {
    return (
        <div className="flex-grow">
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1">
                <p className="my-0.5 flex-grow">TEXTURE LAYERS</p>
            </div>
            <div className="dark:bg-gray-800 bg-gray-200 dark:text-gray-400 text-black font-bold text-xs p-1">
                <TextureGroupDropdown />
            </div>
            <div className="h-full overflow-y-scroll pr-2 studio-scrollbar">
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

const TextureGroupDropdown = () => {
    return (
        <div className="mx-0.5">
            <Dropdown title="Texture Group" header="SET GROUP">
                <div className="px-0.5 py-1">
                    <DropdownItem name="Default" onSelect={() => console.log("set group")} />
                    <DropdownItem name="JP Female" onSelect={() => console.log("set group")} />
                    <DropdownItem name="JP Male" onSelect={() => console.log("set group")} />
                </div>
            </Dropdown>
        </div>
    );
}

const TexturerLayer = ({ name, selected }: { name: string, selected: boolean }) => {

    return (
        <div className={(selected ? "bg-sky-500" : "dark:bg-gray-700 bg-gray-100 dark:text-white text-black") + " my-1 rounded-sm h-8 text-left pl-2 w-full flex flex-row ml-1"} >
            <button className="flex-grow truncate text-left">{name}</button>

            <p className="mr-2 flex flex-row text-white">
                <button className={(selected ? "bg-sky-600 hover:bg-sky-700" : "dark:bg-gray-800 bg-gray-400 dark:hover:bg-gray-900 hover:bg-gray-300") + " rounded pr-2 pl-2 py-0.5 my-0.5 mr-1"}><SVGEye className="h-4 w-4" /></button>
                <button className={(selected ? "bg-sky-600 hover:bg-sky-700" : "dark:bg-gray-800 bg-gray-400 dark:hover:bg-gray-900 hover:bg-gray-300") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}><SVGLocked className="h-4 w-4 group-hover:text-red-500" /></button>
            </p>
        </div>
    )
}

export default TexturerSidebar;