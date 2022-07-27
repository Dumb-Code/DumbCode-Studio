import { useOptions } from "../../../../../contexts/OptionsContext"
import OptionButton from "../../OptionButton"
import { OptionCategorySection } from "../../OptionCategories"

const SelectedCubesComponent = () => {
  const { unifiedSelectedCubes, setUnifiedSelectedCubes } = useOptions()
  return (
    <>
      <OptionButton isSelected={unifiedSelectedCubes} toggle={() => setUnifiedSelectedCubes(true)}>
        Per Project
      </OptionButton>
      <OptionButton isSelected={!unifiedSelectedCubes} toggle={() => setUnifiedSelectedCubes(false)}>
        Per Tab
      </OptionButton>
    </>
  )
}

const SelectedCubes: OptionCategorySection = {
  title: "Selected Cubes",
  description: "Manage whether the selected cubes are per project, or per tab.",
  component: SelectedCubesComponent,
}
export default SelectedCubes