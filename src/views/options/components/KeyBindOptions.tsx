import { useCallback, useMemo, useState } from "react"
import { InfoBubble, SVGCross, SVGTrash } from "../../../components/Icons"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useOptions } from "../../../contexts/OptionsContext"
import KeyCombo from "../../../studio/keycombos/KeyCombo"
import { KeyComboCategory } from "../../../studio/keycombos/KeyCombos"
import { useListenableObject } from "../../../studio/util/ListenableObject"

const KeyBindOptions = () => {
    const { keyCombos, keyCombosChanged } = useOptions()

    const resetAll = useCallback(() => {
        Object.keys(keyCombos).forEach(k => {
            const key = k as KeyComboCategory
            const combos = keyCombos[key].combos as Record<string, KeyCombo>
            Object.keys(combos).forEach(key => combos[key].reset())
        })
        keyCombosChanged()
    }, [keyCombos, keyCombosChanged])

    const categories = useMemo(() => Object.keys(keyCombos), [keyCombos])

    return (
        <div className="pb-8">
            <div className="flex flex-row items-center mb-2">
                <p className="text-white font-semibold">KEY BINDINGS</p>
                <ButtonWithTooltip className="bg-gray-500 dark:bg-gray-800 rounded ml-2" tooltip="Reset All" onClick={resetAll}>
                    <SVGTrash className="h-5 w-5 text-red-500 hover:text-red-200" />
                </ButtonWithTooltip>
            </div>

            {categories.map(category => (
                <KeyBindSection
                    key={category}
                    category={category as KeyComboCategory}
                />
            ))}

        </div>
    )
}

const KeyBindSection = ({ category }: { category: KeyComboCategory }) => {
    const { keyCombos } = useOptions()
    const cat = keyCombos[category]
    const combos = useMemo<Record<string, KeyCombo>>(() => cat.combos, [cat.combos])
    return (
        <>
            <p className="text-gray-900 text-xs font-semibold first:mt-0 mt-4">{cat.name}</p>
            <p className="text-gray-900 text-xs mb-2">{cat.desc}</p>
            {Object.keys(combos).map(kb => <KeyBindOption key={kb} keyCombo={combos[kb]} />)}
        </>
    )
}

const KeyBindOption = ({ keyCombo }: { keyCombo: KeyCombo }) => {
    const { keyCombosChanged } = useOptions()
    const [listening, setIsListening] = useState(false)
    const [displayName] = useListenableObject(keyCombo.displayName)

    const [clashes] = useListenableObject(keyCombo.clashedWith)

    const isInvalid = clashes.length !== 0 || !keyCombo.isNothingValid()

    return (
        <div className="flex flex-row ">
            <div className="dark:bg-gray-800 bg-gray-300 m-0.5 rounded-l p-1 text-black dark:text-gray-400 pl-3 w-3/4 flex flex-row">
                {keyCombo.name}
                <ButtonWithTooltip className="w-5 -mt-1" tooltip={keyCombo.moreInfo}>
                    <InfoBubble className="w-4 h-4 mt-1 ml-2" />
                </ButtonWithTooltip>
            </div>
            <ButtonWithTooltip
                tooltip={clashes.length === 0 ? null : `Clashes with ${clashes.map(c => c.name).join(", ")}`}
                className={(listening ? "dark:bg-purple-800 bg-purple-300 dark:hover:bg-purple-600 hover:bg-purple-200" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-600 hover:bg-gray-200") + (isInvalid ? "text-red-700 dark:text-red-400" : "text-black dark:text-gray-400") + " w-40 m-0.5 rounded-r p-1  pl-2 "}
                onClick={() => setIsListening(true)}
                onBlur={() => setIsListening(false)}
                onKeyDown={e => {
                    keyCombo.fromEvent(e)
                    keyCombosChanged()
                    e.preventDefault()
                    e.stopPropagation()
                }}
            >
                {displayName}
            </ButtonWithTooltip>
            {keyCombo.hasChangedFromDefault() &&
                <>
                    <ButtonWithTooltip className="w-5 -mt-1" tooltip="Reset" onClick={() => {
                        keyCombo.reset()
                        keyCombosChanged()
                    }}>
                        <SVGCross className="text-red-500 hover:text-red-200" />
                    </ButtonWithTooltip>
                </>
            }
        </div>
    )
}

export default KeyBindOptions