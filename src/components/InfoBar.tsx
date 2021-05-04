import Dropup, { DropupItem } from './Dropup'
import { SVGCube, SVGEye, SVGGrid, SVGLocked } from './Icons';

const InfoBar = () => {
    return(
        <div className="rounded-sm bg-black h-full flex flex-row">
            <DisplayModeDropup />
            <RenderModeDropup />
            <TextureGroupDropup />
            <button className="bg-gray-900 hover:bg-gray-800 rounded pr-1 pl-2 py-1 my-0.5 mr-1 text-white ml-0.5"><SVGGrid className="h-4 w-4 mr-1" /></button>
            <button className="bg-gray-900 hover:bg-gray-800 rounded pr-1 pl-2 py-1 my-0.5 mr-1 text-white"><SVGCube className="h-4 w-4 mr-1" /></button>
            <button className="bg-gray-900 hover:bg-gray-800 rounded px-2 my-0.5 mr-1 text-white text-xs">0 Total Cubes</button>

            {/*The following elements need to only show up when a cube is selected*/}
            <button className="bg-gray-900 hover:bg-gray-800 rounded px-2 my-0.5 mr-1 text-white text-xs">0 Cubes Selected</button>
            <button className="bg-gray-900 hover:bg-gray-800 rounded pr-1 pl-2 py-1 my-0.5 mr-1 text-white"><SVGEye className="h-4 w-4 mr-1" /></button>
            <button className="bg-gray-900 hover:bg-gray-800 rounded pr-1 pl-2 py-1 my-0.5 mr-1 text-white"><SVGLocked className="h-4 w-4 mr-1" /></button>
            <button className="bg-gray-900 hover:bg-gray-800 rounded px-2 my-0.5 mr-1 text-white text-xs">0 Child Cubes</button>
        </div>
    )
}

const DisplayModeDropup = () => {
    return (
        <div className="mx-0.5">
            <Dropup title="Display Mode" header="DISPLAY MODE">
                <div className="px-0.5 py-1">
                    <DropupItem name="Textured" onSelect={() => console.log("set mode")}/>
                    <DropupItem name="White" onSelect={() => console.log("set mode")}/>
                    <DropupItem name="Outline" onSelect={() => console.log("set mode")}/>
                </div>
            </Dropup>
        </div>
    );
}

const RenderModeDropup = () => {
    return (
        <div className="mx-0.5">
            <Dropup title="Set View" header="SET PERSPECTIVE">
                <div className="px-0.5 py-1">
                    <DropupItem name="Perspective" onSelect={() => console.log("set perspective")}/>
                    <DropupItem name="Orthographic" onSelect={() => console.log("set perspective")}/>
                </div>
            </Dropup>
        </div>
    );
}

const TextureGroupDropup = () => {
    return (
        <div className="mx-0.5">
            <Dropup title="Texture Group" header="SET GROUP">
                <div className="px-0.5 py-1">
                    <DropupItem name="Default" onSelect={() => console.log("set group")}/>
                    <DropupItem name="JP Female" onSelect={() => console.log("set group")}/>
                    <DropupItem name="JP Male" onSelect={() => console.log("set group")}/>
                </div>
            </Dropup>
        </div>
    );
}

export default InfoBar;