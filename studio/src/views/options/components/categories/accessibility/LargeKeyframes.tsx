import { useOptions } from "../../../../../contexts/OptionsContext"
import OptionButton from "../../OptionButton"
import { OptionCategorySection } from "../../OptionCategories"

const LargeKeyframesComponent = () => {
  const {largeKeyframesEnabled, setLargeKeyframesEnabled} = useOptions();
  return (
    <>
      <OptionButton isSelected={!largeKeyframesEnabled} toggle={() => setLargeKeyframesEnabled(false)}>Compact</OptionButton>
      <OptionButton isSelected={largeKeyframesEnabled} toggle={() => setLargeKeyframesEnabled(true)}>Large</OptionButton>
    </>
  )
}

const LargeKeyframes: OptionCategorySection = {
  title: "Large Keyframes",
  description: "Opts in for a less compact but easier to click keyframe depth on the animator tab.",
  component: LargeKeyframesComponent,
}
export default LargeKeyframes