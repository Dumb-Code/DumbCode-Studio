import React, { useCallback } from "react"; //For some reason we need to import react here?
import { SVGUndo } from "../../../../../components/Icons"
import { ButtonWithTooltip } from "../../../../../components/Tooltips"
import { useOptions } from "../../../../../contexts/OptionsContext"
import KeyCombo from "../../../../../studio/keycombos/KeyCombo"
import { KeyComboCategory } from "../../../../../studio/keycombos/KeyCombos"

const KeybindsHeaderResetAll = () => {

  const { keyCombos, keyCombosChanged } = useOptions()

  const resetAll = useCallback(() => {
    Object.keys(keyCombos).forEach(k => {
      const key = k as KeyComboCategory
      const combos = keyCombos[key].combos as Record<string, KeyCombo>
      Object.keys(combos).forEach(key => combos[key].reset())
    })
    keyCombosChanged()
  }, [keyCombos, keyCombosChanged])

  return (
    <ButtonWithTooltip className="bg-gray-300 dark:bg-gray-800 rounded ml-2" tooltip="Reset All" onClick={resetAll}>
      <SVGUndo className="h-5 w-5 text-red-500 hover:text-red-600 p-1" />
    </ButtonWithTooltip>
  )
}

export default KeybindsHeaderResetAll