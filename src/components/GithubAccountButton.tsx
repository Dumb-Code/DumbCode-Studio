import { useFetchGithubUserDetails } from "../studio/util/FetchHooks"
import { useGithubAccessToken } from "../studio/util/LocalStorageHook"
import { SVGCross, SVGGithub } from "./Icons"

const GithubAccountButton = () => {
  const [accessToken, _, removeToken] = useGithubAccessToken()

  return (
    <div className="w-48 h-7 dark:bg-gray-800 bg-gray-300 rounded text-white text-left mr-2 mt-1 mb-1 hover:bg-purple-600 dark:hover:bg-purple-600">
      {accessToken === null ? <LinkGithubButton /> : <SignedInToGithub accessToken={accessToken} removeToken={removeToken} />}
    </div>
  )
}

const LinkGithubButton = () => {
  const linkGH = () => {
    const state = (Math.random() + 1).toString(36)
    localStorage.setItem("github-state", state)
    window.open(`https://github.com/login/oauth/authorize?client_id=6df7dd9f54d48a6ab3a2&scope=repo&state=${state}`, "Auth Github", "width=500,height=500")
  }


  return (
    <button onClick={linkGH} className="h-full pl-4 flex flex-row justify items-center font-semibold ">
      <SVGGithub width="20px" /> <span className="px-2 text-sm">Add Github Account</span>
    </button>
  )
}

const SignedInToGithub = ({ accessToken, removeToken }: { accessToken: string, removeToken: () => void }) => {
  const result = useFetchGithubUserDetails(accessToken)

  return (
    <div className="h-full w-full p-1 flex flex-row items-center justify-center">
      <div><img className="rounded" width={24} src={result?.avatar_url ?? ''} alt="Profile" /></div>
      <div className="pl-3 flex-grow truncate">{result?.name ?? 'Loading...'}</div>
      <button onClick={removeToken} className="p-px bg-red-600 hover:bg-red-300 rounded-md	">
        <SVGCross height="16px" width="16px" />
      </button>
    </div>
  )
}


export default GithubAccountButton 
