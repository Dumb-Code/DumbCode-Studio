import { useState } from "react"

const AccessibilityOptions = () => {

    const [language, setMotion] = useState("normal")

    return(
        <div className="">
            <p className="text-white font-semibold mb-2">ACESSIBILITY OPTIONS</p>

            <p className="text-gray-900 text-xs font-semibold">REDUCED ANIMATIONS</p>
            <p className="text-gray-900 text-xs mb-2">Allows you to reduce animations if you are prone to motion sickness.</p>
            <OptionButton name="Normal" selected={language === "normal"} setMotion={() => setMotion("normal")}/>
            <OptionButton name="Reduced" selected={language === "reduced"} setMotion={() => setMotion("reduced")}/>
        </div>
    )
}

const OptionButton = ({name, selected, setMotion}: {name: string, selected: boolean, setMotion: () => void}) => {
    return(
        <div>
            <button className={(!selected || "ring-2 ring-lightBlue-500") + " dark:bg-gray-800 bg-gray-300 rounded w-80 dark:text-white text-black font-semibold p-2 text-left pl-4 my-1"} onClick={() => setMotion()}>{name}</button>
        </div>
    )
}

export default AccessibilityOptions