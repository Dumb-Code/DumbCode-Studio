import { useOptions } from "../../../../../contexts/OptionsContext"
import OptionButton from "../../OptionButton"
import { OptionCategorySection } from "../../OptionCategories"

const ThemeSelectionComponent = () => {
  const { isSystemDark, theme, setTheme } = useOptions()

  return (
    <>
      <OptionButton isSelected={theme === "auto"} toggle={() => setTheme("auto")} forcedThemeDark={isSystemDark}>System Auto ({isSystemDark ? "Dark" : "Light"})</OptionButton>
      <OptionButton isSelected={theme === "dark"} toggle={() => setTheme("dark")} forcedThemeDark={true}>Dark Mode</OptionButton>
      <OptionButton isSelected={theme === "light"} toggle={() => setTheme("light")} forcedThemeDark={false}>Light Mode</OptionButton>
    </>
  )
}

const ThemeSelection: OptionCategorySection = {
  title: "Theme Selection",
  description: "Allows you to cusomize the interface to your liking.",
  component: ThemeSelectionComponent,
}
export default ThemeSelection
