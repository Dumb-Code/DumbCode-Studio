import { useCallback, useMemo, useRef, useState } from "react"
import { useGitCommitMessage } from "../../contexts/ServersideContext"
import { OptionCategories, OptionCategory, OptionCategoryKeys, OptionCategorySection } from "./components/OptionCategories"
import OptionSearchContext, { useOptionSearchContext } from "./components/OptionSearchContext"
import OptionSection from "./components/OptionSection"

type DisplayType = {
    readonly type: "category" | "search",
    readonly data: string
}


const Options = () => {

    const [optionDisplay, setOptionDisplay] = useState<DisplayType>(() => ({ type: "category", data: OptionCategoryKeys[0] }))

    const lastUsedCategory = useRef(OptionCategoryKeys[0])
    if (optionDisplay.type === "category") {
        lastUsedCategory.current = optionDisplay.data
    }

    const gitCommitMessage = useGitCommitMessage()

    const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const data = e.target.value
        if (data.length === 0) {
            setOptionDisplay({ type: "category", data: lastUsedCategory.current })
        } else {
            setOptionDisplay({ type: "search", data })
        }
    }, [])

    return (
        <div className="flex flex-row h-full">
            <div className="flex flex-col w-1/4 dark:bg-gray-800 bg-gray-200 pt-8 items-end">
                <p className="dark:text-black text-gray-600 font-semibold text-xs w-44 pl-2 mb-1">APP SETTINGS</p>
                {OptionCategoryKeys.map(tab =>
                    <OptionsPageButton
                        key={tab}
                        category={tab}
                        selected={optionDisplay.type === "category" && tab === optionDisplay.data}
                        setTab={() => setOptionDisplay({ type: "category", data: tab })}
                    />
                )}
                <div className="flex-grow"></div>
                <div className="dark:text-gray-400 text-black w-40 mr-4 text-left pl-2 text-xs pb-4">
                    <div>App Version vDEV</div>
                    <div>{gitCommitMessage}</div>
                </div>
            </div>
            <div className="w-3/4 h-full flex flex-col overflow-hidden dark:bg-gray-600 bg-gray-100 p-6">
                <div className="flex flex-row items-center text-black">
                    Search:
                    <input
                        className="flex-grow py-1 px-2 ml-2 rounded dark:bg-gray-500 bg-gray-400 outline-none"
                        value={optionDisplay.type === "search" ? optionDisplay.data : ""}
                        onChange={onInputChange}
                    />
                </div>
                <div className="flex-grow min-h-0 overflow-auto studio-scrollbar mt-5">
                    {optionDisplay.type === "search" ?
                        <SearchedOptionCategory search={optionDisplay.data.trim()} /> :
                        <NonSearchedOptionCategory optionCategory={OptionCategories[optionDisplay.data]} />
                    }
                </div>
            </div>
        </div>
    )
}

const NonSearchedOptionCategory = ({ optionCategory }: { optionCategory: OptionCategory }) => {
    const Header = optionCategory.headerComponent
    return (
        <div>
            <div className="flex flex-row items-center mb-2">
                <p className="dark:text-white font-semibold">{optionCategory.title}</p>
                {Header && <Header />}
            </div>
            <OptionSections sections={optionCategory.sections} />
        </div>
    )
}

const SearchedOptionCategory = ({ search }: { search: string }) => {
    const searchResults = useMemo(() => {
        const searchFilters = search.split(" ")
            .map(str => str.toLocaleLowerCase())
            .map(str => (input: string) => input.includes(str))

        //The weight is how many of the search (split by " ") are in the input. 
        //Note that this is how many unique search terms, not the total number of search terms.
        const getWeight = (input?: string) => input === undefined ? 0 : searchFilters.filter(filter => filter(input)).length

        return OptionCategoryKeys.flatMap(key => OptionCategories[key].sections)
            .map(section => ({
                section,
                weight: Math.max(
                    getWeight(section.title.toLowerCase()),
                    getWeight(section.description?.toLowerCase()),
                    getWeight(section.additionalText?.toLowerCase())
                )
            }))
            .filter(section => section.weight > 0)
            .sort((a, b) => b.weight - a.weight)
            .map(section => section.section)

    }, [search])


    return searchResults.length === 0 ? (
        <div className="flex flex-col items-center">
            <p className="dark:text-white text-gray-600 font-semibold text-xs">No results found</p>
        </div>
    ) : (
        <OptionSearchContext search={search}>
            <OptionSections sections={searchResults} search={search} />
        </OptionSearchContext>
    )
}

const OptionSections = ({ sections, search }: { sections: readonly OptionCategorySection[], search?: string }) => {
    const { blockedBySearch } = useOptionSearchContext()
    return (
        <>
            {sections.filter(section => section.shouldRender === undefined || section.shouldRender(blockedBySearch)).map(section => (
                <OptionSection key={section.title} title={section.title} search={search} description={section.description}>
                    <section.component />
                </OptionSection>
            ))}
        </>
    )
}

const OptionsPageButton = ({ category, setTab, selected }: { category: string, setTab: () => void, selected: boolean }) => {
    const option = OptionCategories[category]
    return (
        <button
            className={
                (selected ?
                    "bg-gray-400 dark:bg-gray-700" :
                    "bg-gray-200 dark:bg-gray-800"
                ) + " rounded dark:text-white text-black py-1 my-1 hover:bg-gray-100 dark:hover:bg-gray-900 w-40 mr-4 text-left pl-2"
            }
            onClick={() => setTab()}>
            {option.shortName}
        </button>
    )
}

export default Options
