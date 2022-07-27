import { SVGOpenLink } from "../../../../../components/Icons"
import LinkGithubButton from "../../../../../components/LinkGithubButton"
import { useGithubClientId } from "../../../../../contexts/ServersideContext"
import { useFetchGithubUserDetails } from "../../../../../studio/util/FetchHooks"
import { useGithubAccessToken } from "../../../../../studio/util/LocalStorageHook"
import { OptionCategorySection } from "../../OptionCategories"

const LinkedGithubAccountComponent = () => {
  const [accessToken, removeToken] = useGithubAccessToken()
  return accessToken ? <Settings accessToken={accessToken} removeToken={removeToken} /> : <NoAccount />
}

const NoAccount = () => {
  return (
    <div className="mt-4">
      <p className="text-white text-xs">No account currently linked, add one below</p>
      <LinkGithubButton />
    </div>
  )
}

const Settings = ({ accessToken, removeToken }: { accessToken: string, removeToken: () => void }) => {

  const result = useFetchGithubUserDetails(accessToken)
  const githubClientId = useGithubClientId()

  return (
    <div className="w-80 text-center text-black dark:text-gray-300">

      <div className="mb-1">
        <div className="pl-3 flex-grow truncate dark:bg-gray-800 bg-gray-300 rounded px-4 py-1 ">{result?.name ?? 'Loading...'}</div>
      </div>

      <a target="_blank" className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-800 dark:hover:bg-gray-900 px-4 py-1 rounded cursor-pointer flex flex-row justify-center items-center mb-1" rel="noopener noreferrer" href={`https://github.com/settings/connections/applications/${githubClientId}`}>
        Review Access
        <SVGOpenLink className="ml-2 w-4 h-4" />
      </a>

      <div className="flex flex-row bg-red-500 dark:bg-red-700 hover:bg-red-600 px-4 py-1 rounded cursor-pointer" onClick={removeToken}>
        <p className="w-full">Logout</p>
      </div>

    </div>
  )
}

const LinkedGithubAccount: OptionCategorySection = {
  title: "Linked Github Account",
  component: LinkedGithubAccountComponent,
}
export default LinkedGithubAccount