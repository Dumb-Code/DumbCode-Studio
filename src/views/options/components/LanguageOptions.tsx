import { useState } from "react"

const LanguageOptions = () => {

    const [language, setLanguage] = useState("english")

    return(
        <div className="">
            <p className="text-white font-semibold mb-2">LANGUAGE OPTIONS</p>

            <p className="text-gray-900 text-xs font-semibold">LANGUAGE SELECTION</p>
            <p className="text-gray-900 text-xs mb-2">Allows you to pick your most familliar language.</p>
            <LanguageButton name="English (US)" selected={language === "english"} setLanguage={() => setLanguage("english")}/>
            <LanguageButton name="English (EU)" selected={language === "englishwrong"} setLanguage={() => setLanguage("englishwrong")}/>
        </div>
    )
}

const LanguageButton = ({name, selected, setLanguage}: {name: string, selected: boolean, setLanguage: () => void}) => {
    return(
        <div>
            <button className={(!selected || "ring-2 ring-lightBlue-500") + " bg-gray-800 rounded w-80 text-white font-semibold p-2 text-left pl-4 my-1"} onClick={() => setLanguage()}>{name}</button>
        </div>
    )
}

export default LanguageOptions