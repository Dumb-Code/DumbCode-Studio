import { ChangeEventHandler, KeyboardEventHandler, MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKeyCombos } from "../contexts/OptionsContext";
import { NeededEventData } from "../studio/keycombos/KeyCombo";

const NumericInput = ({
  value, onChange,
  startBatchActions, endBatchActions,
  isPositiveInteger = false,
  defaultValue = 0,
  hideArrows = false,
  background = "bg-gray-300 dark:bg-gray-700",
  min, max
}: {
  value?: number | null | undefined,
  onChange?: (value: number) => void,

  startBatchActions?: () => void,
  endBatchActions?: () => void,

  isPositiveInteger?: boolean
  defaultValue?: number
  hideArrows?: boolean

  min?: number
  max?: number

  background?: string
}) => {

  const inputRef = useRef<HTMLInputElement>(null)

  const clampValue = useCallback((num: number) => {
    if (isPositiveInteger && num < 0) {
      num = 0
    }
    if (min !== undefined && num < min) {
      num = min
    }
    if (max !== undefined && num > max) {
      num = max
    }
    return num
  }, [isPositiveInteger, min, max])

  const stringToNum = useCallback((string: string) => {
    const num = clampValue(isPositiveInteger ? parseInt(string) : parseFloat(string))
    return isNaN(num) ? defaultValue : num
  }, [isPositiveInteger, defaultValue, clampValue])
  const numToString = useCallback((value: number | null | undefined) => value?.toFixed(isPositiveInteger ? 0 : 2) ?? "", [isPositiveInteger])

  const [typedValue, setTypedValue] = useState(numToString(value))
  const [isFocused, setIsFocused] = useState(false)


  const onTyped = useCallback<ChangeEventHandler<HTMLInputElement>>(event => {
    setTypedValue(event.currentTarget.value)
    if (onChange) {
      onChange(stringToNum(event.currentTarget.value))
    }
  }, [stringToNum, onChange])

  const onInputFocus = useCallback(() => {
    setIsFocused(true)
    setTypedValue(numToString(value))
    if (startBatchActions) {
      startBatchActions()
    }
  }, [value, numToString, setTypedValue, startBatchActions])

  const onInputBlur = useCallback(() => {
    setIsFocused(false)
    if (onChange) {
      onChange(stringToNum(typedValue))
    }
    if (endBatchActions) {
      endBatchActions()
    }
  }, [typedValue, stringToNum, onChange, endBatchActions])

  const inputValue = useMemo(() => isFocused ? typedValue : numToString(value), [isFocused, typedValue, numToString, value])
  const { input_multipliers: combos } = useKeyCombos()

  const getDeltaValue = useCallback((event: NeededEventData) => {
    const maxPriorityItem = Object.keys(combos.combos)
      .map(key => ({
        key: key as keyof typeof combos.combos,
        value: combos.combos[key as keyof typeof combos.combos],
      }))
      .filter(item => item.value.matchesUnknownEvent(event))
      .sort((a, b) => a.value.computePriority() - b.value.computePriority())[0]

    if (maxPriorityItem === undefined) {
      return 0
    }

    switch (maxPriorityItem.key) {
      case "multiply_0_01": return isPositiveInteger ? 10 : 0.01
      case "multiply_0_1": return isPositiveInteger ? 1 : 0.1
      case "multiply_1": return 1
      case "multiply_10": return 10
    }
  }, [combos, isPositiveInteger])

  const modifyIncrease = useCallback((e: NeededEventData) => {
    if (value !== null && value !== undefined) {
      const newValue = clampValue(value + getDeltaValue(e))
      if (onChange) {
        onChange(newValue)
      }
      setTypedValue(numToString(newValue))
    }
  }, [value, onChange, getDeltaValue, setTypedValue, numToString, clampValue])

  const modifyDecrease = useCallback((e: NeededEventData) => {
    if (value !== null && value !== undefined) {
      const newValue = clampValue(value - getDeltaValue(e))
      if (onChange) {
        onChange(newValue)
      }
      setTypedValue(numToString(newValue))
    }
  }, [value, onChange, getDeltaValue, setTypedValue, numToString, clampValue])

  const onKeyDown = useCallback<KeyboardEventHandler>(e => {
    if (e.key === "ArrowUp") {
      modifyIncrease(e)
      e.preventDefault()
    } else if (e.key === "ArrowDown") {
      modifyDecrease(e)
      e.preventDefault()
    } else if (e.key === "Enter") {
      if (inputRef.current) {
        inputRef.current.blur()
      }
    }
  }, [modifyIncrease, modifyDecrease])

  //Assign the onWheel event to the input like this, as to allow for preventing the default behavior
  useEffect(() => {
    const currentInput = inputRef.current
    if (currentInput === null) {
      return
    }
    const callback = (e: WheelEvent) => {
      if (!isFocused) {
        currentInput.focus()
      }
      if (e.deltaY < 0) {
        modifyIncrease(e)
      } else {
        modifyDecrease(e)
      }
      e.preventDefault()
      e.stopPropagation()
    }
    currentInput.addEventListener("wheel", callback, { passive: false })
    return () => {
      currentInput.removeEventListener("wheel", callback)
    }
  }, [isFocused, modifyIncrease, modifyDecrease, inputRef, startBatchActions, endBatchActions])



  return (
    <div className={background + " w-full h-full flex flex-row items-center pl-1"}>
      <input
        disabled={value === null || value === undefined}
        ref={inputRef}
        className={background + " text-xs dark:text-white py-2 flex-grow cursor-text w-full h-full outline-0 outline-none"}
        value={inputValue}
        onChange={onTyped}
        onFocus={onInputFocus}
        onBlur={onInputBlur}
        onKeyDown={onKeyDown}
      />
      {!hideArrows && (
        <div className="text-gray-700 dark:text-gray-400" style={{ fontSize: 8 }}>
          <InputArrow text="&#9650;" onClick={modifyIncrease} />
          <InputArrow text="&#9660;" onClick={modifyDecrease} />
        </div>
      )}
    </div>
  )
}

const InputArrow = ({ text, onClick }: { text: string, onClick?: MouseEventHandler }) => <button onClick={onClick} className="flex justify-center items-center rounded-sm m-1 w-3 hover:text-gray-500 hover:bg-gray-200 first:mb-0 last:mt-0">{text}</button>

export default NumericInput;