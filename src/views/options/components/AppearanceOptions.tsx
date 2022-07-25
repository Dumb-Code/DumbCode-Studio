import { useOptions } from "../../../contexts/OptionsContext";
import OptionButton from "./OptionButton";

const AppearanceOptions = () => {
    const { isSystemDark, theme, setTheme, compactMode, setCompactMode } = useOptions()

    return (
        <div className="">
            <p className="text-black dark:text-white font-semibold mb-2 transition-colors duration-200">APPEARANCE OPTIONS</p>

            <p className="text-gray-900 text-xs font-semibold">THEME SELECTION</p>
            <p className="text-gray-900 text-xs mb-2">Allows you to cusomize the interface to your liking.</p>
            <div className="flex flex-col">
                <OptionButton isSelected={theme === "auto"} toggle={() => setTheme("auto")} forcedThemeDark={isSystemDark}>System Auto ({isSystemDark ? "Dark" : "Light"})</OptionButton>
                <OptionButton isSelected={theme === "dark"} toggle={() => setTheme("dark")} forcedThemeDark={true}>Dark Mode</OptionButton>
                <OptionButton isSelected={theme === "light"} toggle={() => setTheme("light")} forcedThemeDark={false}>Light Mode</OptionButton>
            </div>

            <p className="text-gray-900 text-xs font-semibold mt-4">MODE SELECTION</p>
            <p className="text-gray-900 text-xs mb-2">Allows you to fine tune some of the layouts.</p>
            <div className="flex flex-col">
                <OptionButton isSelected={true} toggle={() => console.log("normal")}>Normal Mode</OptionButton>
                <OptionButton isSelected={false} disabled toggle={() => console.log("normal")}>Compact Mode</OptionButton>
            </div>
        </div>
    )
}

export default AppearanceOptions