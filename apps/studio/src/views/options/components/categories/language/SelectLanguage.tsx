import { useState } from "react"
import OptionButton from "../../OptionButton"
import { OptionCategorySection } from "../../OptionCategories"

const SelectLanguageComponent = () => {

  const [language, setLanguage] = useState("english")

  return (
    <>
      <OptionButton isSelected={language === "englishwrong"} toggle={() => setLanguage("englishwrong")}>English (US)</OptionButton>
      <OptionButton isSelected={language === "english"} toggle={() => setLanguage("english")}>English (EU)</OptionButton>
    </>
  )
}

const SelectLanguage: OptionCategorySection = {
  title: "Language Selection",
  description: "Allows you to pick your most familliar language.",
  component: SelectLanguageComponent,
}
export default SelectLanguage