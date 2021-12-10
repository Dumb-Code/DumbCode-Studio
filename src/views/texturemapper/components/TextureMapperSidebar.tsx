import NumericInput from 'react-numeric-input';
import Checkbox from "../../../components/Checkbox";
import CollapsableSidebarPannel from '../../../components/CollapsableSidebarPannel';
import HistoryList from '../../../components/HistoryList';

const TextureMapperSidebar = () => {
    return (
        <div className="dark:bg-gray-800 bg-gray-200 flex flex-col overflow-x-hidden overflow-y-scroll studio-scrollbar h-full">
            <TextureProperties />
            <TextureMapElementProperties />
            <HistoryList />
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
        <CollapsableSidebarPannel title="CUBE UV PROPERTIES" heightClassname="h-auto" panelName="texture_element_properties">
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
        </CollapsableSidebarPannel>
    )
}


export default TextureMapperSidebar;