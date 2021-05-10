import { useState } from "react"
import AppearanceOptions from "./components/AppearanceOptions"
import LanguageOptions from "./components/LanguageOptions"
import AcessibilityOptions from "./components/AcessibilityOptions"
import KeyBindOptions from "./components/KeyBindOptions"
import LinksToOurStuff from "./components/LinksToOurStuff"

type OptionsTab = {
    name: string;
    component: () => JSX.Element;
}

const OptionsTabs: OptionsTab[] = [
    { name: "Appearance", component: () => <AppearanceOptions /> },
    { name: "Language", component: () => <LanguageOptions /> },
    { name: "Acessibility", component: () => <AcessibilityOptions /> },
    { name: "Key Binds", component: () => <KeyBindOptions /> },
    { name: "Links", component: () => <LinksToOurStuff /> },
]

const Options = () => {

    const[optionsTab, setOptionsTab] = useState(OptionsTabs[0])

    return(
        <div className="flex flex-row h-full overflow-y-hidden">
            <div className="flex flex-col w-1/4 bg-gray-800 pt-8 items-end">
                <p className="text-black font-semibold text-xs w-44 pl-2 mb-1">APP SETTINGS</p>
                {OptionsTabs.map(tab => <OptionsPageButton key={tab.name} tab={tab} selected={tab === optionsTab} setTab={() => setOptionsTab(tab)} />)}
            </div>
            <div className="w-3/4 h-full overflow-y-scroll bg-gray-700 p-6">
                {optionsTab.component()}
            </div>
        </div>
    )
}

const OptionsPageButton = ({tab, setTab, selected}: {tab: OptionsTab, setTab: () => void, selected: boolean}) => {
    return(
        <button className={(selected ? "bg-gray-700" : "bg-gray-800") + " rounded text-white py-1 my-1 hover:bg-gray-900 w-40 mr-4 text-left pl-2"} onClick={() => setTab()}>{tab.name}</button>
    )
}

export default Options
