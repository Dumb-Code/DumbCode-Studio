import NumericInput from 'react-numeric-input';
import Checkbox from "../../../components/Checkbox";
import CollapsableSidebarPannel from '../../../components/CollapsableSidebarPannel';

const TexturerSidebar = () => {
    return (
        <div className="dark:bg-gray-800 bg-gray-200 flex flex-col overflow-hidden h-full">
            <TextureProperties />
            <TextureMapElementProperties />
        </div>
    )
}

const TextureProperties = () => {
    return (
        <CollapsableSidebarPannel title="TEXTURE PROPERTIES" heightClassname="h-auto" panelName="texture_properties">
            <div className="flex flex-row py-1">
                <div className="mx-1">
                    <p className="dark:text-gray-400 text-black text-xs">WIDTH</p>
                    <NumericInput />
                </div>
                <div className="mx-1">
                    <p className="dark:text-gray-400 text-black  text-xs">HEIGHT</p>
                    <NumericInput />
                </div>
            </div>
        </CollapsableSidebarPannel>
    )
}

const TextureMapElementProperties = () => {
    return (
        <div className="mb-1">
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1">
                <p className="my-0.5 flex-grow">CUBE UV PROPERTIES</p>
            </div>
            <div className="flex flex-row py-1">
                <div className="mx-1">
                    <p className="dark:text-gray-400 text-black  text-xs">MIRROR</p>
                    <div className="px-2">
                        <Checkbox value={false} setValue={e => console.log("set value" + e)} />
                    </div>
                </div>
                <div className="mx-1">
                    <p className="dark:text-gray-400 text-black  text-xs">X OFFSET</p>
                    <NumericInput />
                </div>
                <div className="mx-1">
                    <p className="dark:text-gray-400 text-black  text-xs">Y OFFSET</p>
                    <NumericInput />
                </div>
            </div>
        </div>
    )
}


export default TexturerSidebar;