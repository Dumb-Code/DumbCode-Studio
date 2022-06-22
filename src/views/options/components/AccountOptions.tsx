import GithubAccountButton from "../../../components/GithubAccountButton"
import { SVGOpenLink } from "../../../components/Icons"
import { useGithubClientId } from "../../../contexts/GithubApplicationContext"

const AccountOptions = () => {
    const githubClientId = useGithubClientId()

    return (
        <div className="">
            <p className="text-white font-semibold mb-2">LINKED ACCOUNTS OPTIONS</p>

            <p className="text-gray-900 text-xs font-semibold">LINKED GITHUB ACCOUNT</p>
            <div className="flex flex-row">
                <div className="w-64 dark:text-white bg-gray-800 rounded h-10 ">
                    <GithubAccountButton />
                </div>
                <a target="_blank" rel="noopener noreferrer" href={`https://github.com/settings/connections/applications/${githubClientId}`} className="flex flex-row justify-center items-center dark:bg-gray-800 bg-gray-300 rounded dark:text-white text-black font-semibold py-2 px-4 text-left ml-2 hover:bg-purple-600 dark:hover:bg-purple-600">
                    Review Access
                    <SVGOpenLink className="ml-2 w-4 h-4" />
                </a>

            </div>

        </div>
    )
}

export default AccountOptions