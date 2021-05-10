import { InfoBubble } from "../../../components/Icons"
import { ButtonWithTooltip } from "../../../components/Tooltips"

const KeyBindOptions = () => {

    return(
        <div className="pb-8">
            <p className="text-white font-semibold mb-2">KEY BINDINGS</p>

            <p className="text-gray-900 text-xs font-semibold">COMMON SHORTCUT BINDINGS</p>
            <p className="text-gray-900 text-xs mb-2">Key bindings that apply all across the studio.</p>
            <KeyBindOption name="Copy" selected={"Ctrl + C"} moreInfo="Copies the field value"/>
            <KeyBindOption name="Paste" selected={"Ctrl + V"} moreInfo="Pastes the field value"/>
            <KeyBindOption name="Undo" selected={"Ctrl + Z"} moreInfo="Un does the last operation"/>
            <KeyBindOption name="Redo" selected={"Ctrl + Y"} moreInfo="Re does the last undone operation"/>
            <KeyBindOption name="Repeat Previous Command" selected={"Spacebar"} moreInfo="Repeats the last command run by the user"/>

            <p className="text-gray-900 text-xs font-semibold mt-4">COMMON INTERFACE BINDINGS</p>
            <p className="text-gray-900 text-xs mb-2">Key bindings that apply all across the studio.</p>
            <KeyBindOption name="Drag Select" selected={"Shift + Click + Drag"} moreInfo="Selects all objects in selection"/>
            <KeyBindOption name="Rotate Camera" selected={"Click + Drag"} moreInfo="Copies the field value"/>
            <KeyBindOption name="Pan Camera" selected={"RightClick + Drag"} moreInfo="Copies the field value"/>

            <p className="text-gray-900 text-xs font-semibold mt-4">CAMERA VIEW BINDINGS</p>
            <p className="text-gray-900 text-xs mb-2">Key bindings that apply all across the studio.</p>
            <KeyBindOption name="Front View" selected={"Num 5"} moreInfo="Moves the camera to view the Front of the model"/>
            <KeyBindOption name="Back View" selected={"Ctrl + Num 5"} moreInfo="Moves the camera to view the Back of the model"/>
            <KeyBindOption name="Left View" selected={"Ctrl + Num 4"} moreInfo="Moves the camera to view the Left of the model"/>
            <KeyBindOption name="Right View" selected={"Ctrl + Num 6"} moreInfo="Moves the camera to view the Right of the model"/>
            <KeyBindOption name="Top View" selected={"Ctrl + Num 8"} moreInfo="Moves the camera to view the Top of the model"/>
            <KeyBindOption name="Bottom View" selected={"Ctrl + Num 2"} moreInfo="Moves the camera to view the Bottom of the model"/>

            <p className="text-gray-900 text-xs font-semibold mt-4">CAMERA ROTATION BINDINGS</p>
            <p className="text-gray-900 text-xs mb-2">Key bindings that apply all across the studio.</p>
            <KeyBindOption name="Rotate View Left" selected={"Num 4"} moreInfo="Rotates the camera slightly Left"/>
            <KeyBindOption name="Rotate View Right" selected={"Num 6"} moreInfo="Rotates the camera slightly Right"/>
            <KeyBindOption name="Rotate View Up" selected={"Num 8"} moreInfo="Rotates the camera slightly Up"/>
            <KeyBindOption name="Rotate View Down" selected={"Num 2"} moreInfo="Rotates the camera slightly Down"/>

            <p className="text-gray-900 text-xs font-semibold mt-4">MODELER BINDINGS</p>
            <p className="text-gray-900 text-xs mb-2">Key bindings that apply all across the studio.</p>
            <KeyBindOption name="Delete" selected={"Del"} moreInfo="Deletes the selected object."/>
            <KeyBindOption name="Delete + Children" selected={"Ctrl + Del"} moreInfo="Deletes the selected object and it's children."/>
            <KeyBindOption name="Copy Cube(s)" selected={"Ctrl + C"} moreInfo="Copies the selected cube"/>
            <KeyBindOption name="Paste Cube(s)" selected={"Ctrl + V"} moreInfo="Pastes the copied cubes in place"/>
        </div>
    )
}

const KeyBindOption = ({name, selected, moreInfo}: {name: string, selected: string, moreInfo: string}) => {
    return(
        <div className="flex flex-row w-3/4">
            <div className="bg-gray-800 m-0.5 rounded-l p-1 text-gray-300 font-semibold pl-3 flex-grow flex flex-row">
                {name}
                <ButtonWithTooltip className="w-5 -mt-1" delay={0} tooltip={moreInfo} direction="right">
                    <InfoBubble className="w-4 h-4 mt-1 ml-2" />
                </ButtonWithTooltip>
            </div>
            <div className="bg-gray-800 w-40 m-0.5 rounded-r p-1 text-gray-400 pl-2 hover:bg-gray-600">{selected}</div>
        </div>
    )
}

export default KeyBindOptions