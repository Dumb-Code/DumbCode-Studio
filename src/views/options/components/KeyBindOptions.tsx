import { useCallback, useState } from "react"
import { InfoBubble, SVGCross, SVGTrash } from "../../../components/Icons"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useOptions } from "../../../contexts/OptionsContext"
import KeyCombo from "../../../studio/keycombos/KeyCombo"
import { KeyComboKey } from "../../../studio/keycombos/KeyCombos"
import { useListenableObject } from "../../../studio/util/ListenableObject"

const KeyBindOptions = () => {
    const { keyCombos } = useOptions()

    const resetAll = useCallback(() => {
        Object.keys(keyCombos).forEach(k => {
            const key = k as KeyComboKey
            keyCombos[key].reset()
        })
    }, [])

    return (
        <div className="pb-8">
            <div className="flex flex-row items-center mb-2">
                <p className="text-white font-semibold">KEY BINDINGS</p>
                <ButtonWithTooltip className="bg-gray-500 dark:bg-gray-800 rounded ml-2" tooltip="Reset All" onClick={resetAll}>
                    <SVGTrash className="h-5 w-5 text-red-500 hover:text-red-200" />
                </ButtonWithTooltip>
            </div>

            <KeyBindSection
                name="COMMON SHORTCUT BINDINGS"
                desc="Key bindings that apply all across the studio."
                keybinds={["common_copy", "common_paste", "common_undo", "common_redo", "common_repeat_previous_command"]}
            />

            <KeyBindSection
                name="CAMERA VIEW BINDINGS"
                desc="Key bindings that apply all across the studio."
                keybinds={["camera_view_front_view", "camera_view_back_view", "camera_view_left_view", "camera_view_right_view", "camera_view_top_view", "camera_view_bottom_view"]}
            />

            <KeyBindSection
                name="CAMERA ROTATION BINDINGS"
                desc="Key bindings that apply all across the studio."
                keybinds={["camera_rotation_rotate_view_left", "camera_rotation_rotate_view_right", "camera_rotation_rotate_view_up", "camera_rotation_rotate_view_down"]}
            />

            <KeyBindSection
                name="MODELER BINDINGS"
                desc="Key bindings that apply to the modeler."
                keybinds={["modeler_delete", "modeler_delete_and_children"]}
            />

            <KeyBindSection
                name="ANIMATOR BINDINGS"
                desc="Key bindings that apply to the animator."
                keybinds={["animator_delete", "animator_individually_select"]}
            />
        </div>
    )
}

const KeyBindSection = ({ name, desc, keybinds }: { name: string, desc: string, keybinds: KeyComboKey[] }) => {
    const { keyCombos } = useOptions()
    return (
        <>
            <p className="text-gray-900 text-xs font-semibold first:mt-0 mt-4">{name}</p>
            <p className="text-gray-900 text-xs mb-2">{desc}</p>
            {keybinds.map(kb => <KeyBindOption key={kb} keyCombo={keyCombos[kb]} />)}
        </>
    )
}

const KeyBindOption = ({ keyCombo }: { keyCombo: KeyCombo }) => {
    const { saveOptions } = useOptions()
    const [listening, setIsListening] = useState(false)
    const [displayName] = useListenableObject(keyCombo.displayName)

    return (
        <div className="flex flex-row ">
            <div className="dark:bg-gray-800 bg-gray-300 m-0.5 rounded-l p-1 text-black dark:text-gray-400 pl-3 w-3/4 flex flex-row">
                {keyCombo.name}
                <ButtonWithTooltip className="w-5 -mt-1" tooltip={keyCombo.moreInfo}>
                    <InfoBubble className="w-4 h-4 mt-1 ml-2" />
                </ButtonWithTooltip>
            </div>
            <button
                className={(listening ? "dark:bg-purple-800 bg-purple-300 dark:hover:bg-purple-600 hover:bg-purple-200" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-600 hover:bg-gray-200") + " w-40 m-0.5 rounded-r p-1 text-black dark:text-gray-400 pl-2 "}
                onClick={() => setIsListening(true)}
                onBlur={() => setIsListening(false)}
                onKeyDown={e => {
                    keyCombo.fromEvent(e)
                    saveOptions()
                    e.preventDefault()
                    e.stopPropagation()
                }}
            >
                {displayName}
            </button>
            {keyCombo.hasChangedFromDefault() &&
                <>
                    <ButtonWithTooltip className="w-5 -mt-1" tooltip="Reset" onClick={() => keyCombo.reset()}>
                        <SVGCross className="text-red-500 hover:text-red-200" />
                    </ButtonWithTooltip>
                </>
            }
        </div>
    )
}

export default KeyBindOptions