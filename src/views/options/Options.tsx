import { useState } from "react"
import AccountOptions from "./components/AccountOptions"
import AcessibilityOptions from "./components/AcessibilityOptions"
import AppearanceOptions from "./components/AppearanceOptions"
import GeneralOptions from "./components/GeneralOptions"
import KeyBindOptions from "./components/KeyBindOptions"
import LanguageOptions from "./components/LanguageOptions"
import LinksToOurStuff from "./components/LinksToOurStuff"

type OptionsTab = {
    name: string;
    component: () => JSX.Element;
}

const OptionsTabs: OptionsTab[] = [
    { name: "General", component: () => <GeneralOptions /> },
    { name: "Appearance", component: () => <AppearanceOptions /> },
    { name: "Linked Accounts", component: () => <AccountOptions /> },
    { name: "Language", component: () => <LanguageOptions /> },
    { name: "Acessibility", component: () => <AcessibilityOptions /> },
    { name: "Key Binds", component: () => <KeyBindOptions /> },
    { name: "Links", component: () => <LinksToOurStuff /> },
]

const Options = () => {

    const [optionsTab, setOptionsTab] = useState(OptionsTabs[0])

    return (
        <div className="flex flex-row h-full">
            <div className="flex flex-col w-1/4 dark:bg-gray-800 bg-gray-200 pt-8 items-end">
                <p className="dark:text-black text-gray-600 font-semibold text-xs w-44 pl-2 mb-1">APP SETTINGS</p>
                {OptionsTabs.map(tab => <OptionsPageButton key={tab.name} tab={tab} selected={tab === optionsTab} setTab={() => setOptionsTab(tab)} />)}
                <div className="flex-grow"></div>
                <div className="dark:text-gray-400 text-black w-40 mr-4 text-left pl-2 text-xs pb-4">
                    App Version v1.0.0
                </div>
            </div>
            <div className="w-3/4 h-full overflow-auto studio-scrollbar dark:bg-gray-700 bg-gray-100 p-6">
                {optionsTab.component()}
            </div>
        </div>
    )
}

const OptionsPageButton = ({ tab, setTab, selected }: { tab: OptionsTab, setTab: () => void, selected: boolean }) => {
    return (
        <button className={(selected ? "bg-gray-400 dark:bg-gray-700" : "bg-gray-200 dark:bg-gray-800") + " rounded dark:text-white text-black py-1 my-1 hover:bg-gray-100 dark:hover:bg-gray-900 w-40 mr-4 text-left pl-2"} onClick={() => setTab()}>{tab.name}</button>
    )
}

export default Options
