import { SVGGithub } from "../../../components/Icons"
import { useFetchGithubUserDetails } from "../../../studio/util/FetchHooks"
import { useGithubAccessTokens } from "../../../studio/util/LocalStorageHook"

const LinkedAccounts = () => {

  const linkGH = () => {
    const state = (Math.random() + 1).toString(36)
    localStorage.setItem("github-state", state)
    window.open(`https://github.com/login/oauth/authorize?client_id=6df7dd9f54d48a6ab3a2&scope=repo&state=${state}`, "Auth Github", "width=500,height=500")
  }

  const [accessTokens, setAccessTokens] = useGithubAccessTokens()

  const removeToken = (index: number) => {
    accessTokens.splice(index, 1)
    setAccessTokens(accessTokens)
  }

  return (
    <div className="">
      <p className="text-white font-semibold mb-2">Github</p>
      <p className="text-gray-900 text-xs mb-1">Link your github account to allow for remote project syncing.</p>
      <button onClick={linkGH} className="dark:bg-gray-800 bg-gray-300 rounded text-white font-semibold p-2 text-left pl-4 my-1 hover:bg-purple-600 flex flex-row justify items-center">
        <SVGGithub width="20px" /> <span className="px-2">Add Github Account.</span>
      </button>
      <p className="text-gray-900 text-s mb-1 mt-2">Linked accounts:</p>
      <div className="bg-gray-200 dark:bg-gray-800 rounded border border-black dark:text-white ">
        {
          accessTokens.length === 0 ? <div className="pl-3 flex flex-col justify-center h-10">It seems rather empty here...</div> :
            accessTokens.map((t, i) =>
              <div key={t}
                className={"flex flex-col justify-center h-10 border-black " + (i === 0 ? '' : 'border-t')}>
                <GithubAccessToken token={t} removeToken={() => removeToken(i)} />
              </div>
            )
        }
      </div>
    </div>
  )
}

const GithubAccessToken = ({ token, removeToken }: { token: string, removeToken: () => void }) => {
  const result = useFetchGithubUserDetails(token)

  return (
    <div className="flex flex-row items-center justify-center">
      <div className="pl-3"><img width={25} src={result?.avatar_url ?? ''} alt="Profile" /></div>
      <div className="pl-3 flex-grow">{result?.name ?? 'Loading...'}</div>
      <button onClick={removeToken} className="mr-3 px-1 bg-red-600 hover:bg-red-300 rounded-md	">
        <div className="flex flex-row items-center justify-center text-black">Remove</div>
      </button>
    </div>
  )
}

export default LinkedAccounts