import { useState } from "react"
import OptionButton from "./OptionButton"

const LanguageOptions = () => {

    const [language, setLanguage] = useState("english")

    return (
        <div className="">
            <p className="dark:text-white font-semibold mb-2">LANGUAGE OPTIONS</p>

            <p className="text-gray-900 text-xs font-semibold">LANGUAGE SELECTION</p>
            <p className="text-gray-900 text-xs mb-2">Allows you to pick your most familliar language.</p>
            <OptionButton isSelected={language === "english"} toggle={() => setLanguage("english")}>English (US)</OptionButton>
            <OptionButton isSelected={language === "englishwrong"} toggle={() => setLanguage("englishwrong")}>English (EU)</OptionButton>
        </div>
    )
}

export default LanguageOptions