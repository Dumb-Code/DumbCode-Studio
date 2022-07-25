import { ChangeEvent } from "react"
import { KeyframeLayerData } from "../studio/formats/animations/DcaAnimation"
import { useListenableObject } from "../studio/listenableobject/ListenableObject"
import { OpenedDialogBox } from "./DialogBoxes"

const defined = "defined"
const addative = "addative"

const KeyframeLayerDialogBox = ({ layer }: { layer: KeyframeLayerData }) => {
  const [isDefined, setIsDefined] = useListenableObject(layer.definedMode)

  const onSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value
    if (value === defined) {
      setIsDefined(true)
    } else if (value === addative) {
      setIsDefined(false)
    } else {
      console.warn(`Don't know how to handle ${value}`)
    }
  }

  return (
    <OpenedDialogBox width="800px" height="800px" title="Reference Images">
      <div className="flex flex-row items-center">
        <div className="mx-2">Keyframe Layer Mode:</div>
        <select onChange={onSelectChange} defaultValue={isDefined ? defined : addative} className="dark:bg-gray-700">
          <option value={defined} >Defined</option>
          <option value={addative} >Addative</option>
        </select>
      </div>
    </OpenedDialogBox >
  )
}

export default KeyframeLayerDialogBox
