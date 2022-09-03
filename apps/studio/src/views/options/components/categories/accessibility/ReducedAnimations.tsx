import { useState } from "react"
import OptionButton from "../../OptionButton"
import { OptionCategorySection } from "../../OptionCategories"

const ReducedAnimationsComponent = () => {
  const [language, setMotion] = useState("normal")
  return (
    <>
      <OptionButton isSelected={language === "normal"} toggle={() => setMotion("normal")}>Normal</OptionButton>
      <OptionButton isSelected={language === "reduced"} toggle={() => setMotion("reduced")}>Reduced</OptionButton>
    </>
  )
}

const ReducedAnimations: OptionCategorySection = {
  title: "Reduced Animations",
  description: "Allows you to reduce animations if you are prone to motion sickness.",
  component: ReducedAnimationsComponent,
}
export default ReducedAnimations