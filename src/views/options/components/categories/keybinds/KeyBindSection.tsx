import { useState } from "react"
import { SVGCross, SVGInfoBubble } from "../../../../../components/Icons"
import { ButtonWithTooltip } from "../../../../../components/Tooltips"
import { useOptions } from "../../../../../contexts/OptionsContext"
import KeyCombo from "../../../../../studio/keycombos/KeyCombo"
import { KeyComboCategory, unsafe_getKeyCombos } from "../../../../../studio/keycombos/KeyCombos"
import { useListenableObject } from "../../../../../studio/listenableobject/ListenableObject"
import { OptionCategorySection } from "../../OptionCategories"

const KeyBindSection = (category: KeyComboCategory): OptionCategorySection => {
  const cat = unsafe_getKeyCombos()[category]
  const combos = cat.combos as Record<string, KeyCombo>
  return {
    title: cat.name,
    description: cat.desc,
    component: () => <>{Object.keys(combos).map(kb => <KeyBindOption key={kb} keyCombo={combos[kb]} />)}</>
  }
}

const KeyBindOption = ({ keyCombo }: { keyCombo: KeyCombo }) => {
  const { keyCombosChanged } = useOptions()
  const [listening, setIsListening] = useState(false)
  const [displayName] = useListenableObject(keyCombo.displayName)

  const [clashes] = useListenableObject(keyCombo.clashedWith)

  const isInvalid = clashes.length !== 0 || !keyCombo.isNothingValid()

  return (
    <div className="flex flex-row w-full">
      <div className="dark:bg-gray-800 bg-gray-300 m-0.5 rounded-l p-1 text-black dark:text-gray-400 pl-3 w-3/4 flex flex-row">
        {keyCombo.name}
        <ButtonWithTooltip className="w-5 -mt-1" tooltip={keyCombo.moreInfo}>
          <SVGInfoBubble className="w-4 h-4 mt-1 ml-2" />
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

export default KeyBindSection
