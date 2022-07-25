import { useState } from "react"
import OptionButton from "./OptionButton"

const AccessibilityOptions = () => {

    const [language, setMotion] = useState("normal")

    return (
        <div className="">
            <p className="dark:text-white font-semibold mb-2">ACESSIBILITY OPTIONS</p>

            <p className="text-gray-900 text-xs font-semibold">REDUCED ANIMATIONS</p>
            <p className="text-gray-900 text-xs mb-2">Allows you to reduce animations if you are prone to motion sickness.</p>
            <OptionButton isSelected={language === "normal"} toggle={() => setMotion("normal")}>Normal</OptionButton>
            <OptionButton isSelected={language === "reduced"} toggle={() => setMotion("reduced")}>Reduced</OptionButton>
        </div>
    )
}

export default AccessibilityOptions