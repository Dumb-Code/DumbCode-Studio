import Image from "next/image"
import { useFetchGithubUserDetails } from "../studio/util/FetchHooks"
import { useGithubAccessToken } from "../studio/util/LocalStorageHook"
import { SVGCross, SVGGithub } from "./Icons"
import { ButtonWithTooltip } from "./Tooltips"

const GithubAccountButton = () => {
  const [accessToken, removeToken] = useGithubAccessToken()

  return (
    <>
      {accessToken === null ? <LinkGithubButton /> : <SignedInToGithub accessToken={accessToken} removeToken={removeToken} />}
    </>
  )
}

const LinkGithubButton = () => {
  const linkGH = () => {
    const state = (Math.random() + 1).toString(36)
    localStorage.setItem("github-state", state)
    window.open(`https://github.com/login/oauth/authorize?client_id=6df7dd9f54d48a6ab3a2&scope=repo&state=${state}`, "Auth Github", "width=500,height=500")
  }


  return (
    <button onClick={linkGH} className="w-full h-full pl-4 flex flex-row justify items-center font-semibold hover:bg-purple-600 dark:hover:bg-purple-600">
      <SVGGithub width="20px" /> <span className="px-2 text-sm">Add Github Account</span>
    </button>
  )
}

const SignedInToGithub = ({ accessToken, removeToken }: { accessToken: string, removeToken: () => void }) => {
  const result = useFetchGithubUserDetails(accessToken)
  return (
    <div className="h-full w-full p-1 flex flex-row items-center justify-center">
      <div className="w-6 flex justify-center">{result !== null && <Image className="rounded" width={24} height={24} src={result.avatar_url} alt="Profile" />}</div>
      <div className="pl-3 flex-grow truncate">{result?.name ?? 'Loading...'}</div>
      <ButtonWithTooltip tooltip="Logout" onClick={removeToken} className="p-px bg-red-600 hover:bg-red-300 rounded-md	">
        <SVGCross height="16px" width="16px" />
      </ButtonWithTooltip>
    </div>
  )
}


export default GithubAccountButton 
