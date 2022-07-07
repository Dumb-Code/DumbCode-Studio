import { ReactNode } from "react";
import { useOptions } from "../../../contexts/OptionsContext";

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

const OptionButton = ({ isSelected, toggle, disabled = false, forcedThemeDark, children }: { isSelected: boolean, toggle: () => void, disabled?: boolean, children: ReactNode, forcedThemeDark?: boolean }) => {
    const choose = (dark: string, light: string) => {
        if (forcedThemeDark === true) {
            return dark
        } else if (forcedThemeDark === false) {
            return light
        }
        return `${dark} ${light}`
    }
    return (
        <div className={forcedThemeDark ? "dark" : ""}>
            <button
                className={
                    (isSelected ? "ring-2 ring-sky-500" : "") +
                    " transition-colors duration-200 rounded w-80 font-semibold p-2 text-left pl-4 my-1 " +
                    (
                        disabled ?
                            `${choose("dark:bg-gray-600", "bg-gray-400")} ${choose("dark:text-gray-800", "text-gray-600")} cursor-not-allowed` :
                            `${choose("dark:bg-gray-800", "bg-gray-300")} ${choose("dark:text-white", "text-black")}`
                        // Do We really need to `choose` for dark theme?
                    )}
                onClick={toggle}
            >
                {children}
            </button>
        </div>

    )
}

export default AppearanceOptions