import { useState } from "react"
import GithubAccountButton from "../../../components/GithubAccountButton"
import { SVGOpenLink } from "../../../components/Icons"

const AccountOptions = () => {

    const [language, setMotion] = useState("normal")

    return (
        <div className="">
            <p className="text-white font-semibold mb-2">LINKED ACCOUNTS OPTIONS</p>

            <p className="text-gray-900 text-xs font-semibold">LINKED GITHUB ACCOUNT</p>
            <div className="flex flex-row">
                <div className="w-64 dark:text-white bg-gray-800 rounded h-10 ">
                    <GithubAccountButton />
                </div>
                <a target="_blank" rel="noopener noreferrer" href="https://github.com/settings/connections/applications/6df7dd9f54d48a6ab3a2" className="flex flex-row justify-center items-center dark:bg-gray-800 bg-gray-300 rounded dark:text-white text-black font-semibold py-2 px-4 text-left ml-2 hover:bg-purple-600 dark:hover:bg-purple-600">
                    Review Access
                    <SVGOpenLink className="ml-2 w-4 h-4" />
                </a>

            </div>

        </div>
    )
}

export default AccountOptions