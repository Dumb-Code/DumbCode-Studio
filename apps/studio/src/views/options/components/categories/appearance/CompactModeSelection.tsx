import { useOptions } from "../../../../../contexts/OptionsContext"
import OptionButton from "../../OptionButton"

export const CompactModeSelectionComponent = () => {
  const { compactMode, setCompactMode } = useOptions()

  return (
    <>
      <OptionButton isSelected={true} toggle={() => console.log("normal")}>Normal Mode</OptionButton>
      <OptionButton isSelected={false} disabled toggle={() => console.log("normal")}>Compact Mode</OptionButton>
    </>
  )
}

const CompactModeSelection = {
  title: "Mode Selection",
  description: "Allows you to fine tune some of the layouts.",
  component: CompactModeSelectionComponent,
}
export default CompactModeSelection