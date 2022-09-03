import { SVGChevronDown, SVGOpenLink, SVGSearch, SVGTick } from "@dumbcode/shared/icons"
import { Listbox, Transition } from "@headlessui/react"
import Image from "next/image"
import { Fragment, useEffect, useState } from "react"
import PagedFetchResult from "../components/PagedFetchResult"
import { useFetchGithubUserDetails } from "../studio/util/FetchHooks"
import { useGithubAccessToken } from "../studio/util/LocalStorageHook"
import { addRecentGithubRemoteProject } from "../studio/util/RemoteProjectsManager"
import { OpenedDialogBox, useOpenedDialogBoxes } from "./DialogBoxes"

type PagedFetchType = {
  default_branch: string
  owner: {
    login: string
    avatar_url: string
  }
  name: string
  url: string
  html_url: string
}

const RemoteRepositoriesDialogBox = () => {
  const [accessToken] = useGithubAccessToken()

  const dialogBox = useOpenedDialogBoxes()

  const currentSelectUser = useFetchGithubUserDetails(accessToken)
  const [username, setUsername] = useState<string | null>(null)
  const [searchedUsername, setSearchedUsername] = useState<string | null>(null)

  useEffect(() => {
    if (username === null && currentSelectUser !== null) {
      const login = currentSelectUser.login
      setUsername(login)
      setSearchedUsername(login)
    }
  }, [username, currentSelectUser])

  const [search, setSearch] = useState("")

  return (
    <OpenedDialogBox width="800px" height="800px" title="Load a Repository">
      <div className="flex flex-col h-full">
        <div className="flex flex-row w-full justify-center items-center pt-2 pr-4">
          <input onKeyPress={e => e.key === "Enter" && setSearchedUsername(username)} value={username ?? ""} onChange={e => setUsername(e.target.value)} className="ml-4 w-32 text-black p-0 m-0 rounded-none rounded-l pl-1 h-8 dark:bg-gray-500 dark:placeholder-gray-800 " type="text" placeholder="Username" />
          <button onClick={() => setSearchedUsername(username)} className="h-8 rounded-none rounded-r p-1 ml-0 flex items-center justify-center dark:text-gray-700 bg-blue-500">
            <SVGSearch width={16} />
          </button>
          <input value={search} onChange={e => setSearch(e.target.value)} className="flex flex-grow ml-4 w-full text-black p-0 pl-1 h-8 dark:bg-gray-500 rounded dark:placeholder-gray-800" type="text" placeholder="Search Repositories" />
        </div>
        <div className="flex-grow overflow-y-auto h-0 mt-2 mb-2 bg-gray-300 dark:bg-gray-700">
          {searchedUsername !== null && accessToken !== null &&
            <RepositoryList search={search.toLowerCase()} tokenUsername={currentSelectUser?.login} username={searchedUsername} token={accessToken} close={dialogBox.clear} />
          }
        </div>
      </div>
    </OpenedDialogBox>
  )
}

const RepositoryList = ({ token, tokenUsername, username, search, close }: { token: string, tokenUsername?: string, username: string, search: string, close: () => void }) => {
  const setRepo = (owner: string, repo: string, branch: string) => {
    addRecentGithubRemoteProject({ owner, repo, branch })
    close()
  }
  return (
    <PagedFetchResult<PagedFetchType>
      key={`${token}#${search}~${username}`}
      baseUrl={username === tokenUsername ? 'https://api.github.com/user/repos' : `https://api.github.com/users/${username}/repos`}
      token={token}
      predicate={r => search.split(" ").every(s => r.owner.login.toLowerCase().replaceAll("-", "").includes(s) || r.name.toLowerCase().replaceAll("-", "").includes(s))}
      loading={() => <div className="h-full flex flex-col justify-center items-center text-gray-500">Loading...</div>}
      error={status => <div className="h-full flex flex-col justify-center items-center text-gray-500">{status === 404 ? `User '${username}' Not Found` : <span className="text-lg text-red-700">Error {status}</span>}</div>}
      empty={() => <div className="h-full flex flex-col justify-center items-center text-gray-500">User has no Repositories</div>}
    >
      {({ value }) => <RepositoryEntry value={value} token={token} setRepo={setRepo} />}
    </PagedFetchResult>
  )
}

const RepositoryEntry = ({ value, token, setRepo }: { value: PagedFetchType, token: string, setRepo: (owner: string, repo: string, branch: string) => void }) => {
  const [branch, setBranch] = useState(value.default_branch)
  return (
    <div onClick={() => setRepo(value.owner.login, value.name, branch)} className="group border-t border-b border-black flex flex-row p-2 items-center hover:bg-gray-500">
      <div className="relative w-[40px]  rounded overflow-hidden">
        <Image className="w-full h-full" src={value.owner.avatar_url ?? '/icons/account_unknown.png'} alt="Profile" width="100%" height="100%" layout="responsive" objectFit="contain" />
      </div>
      <div className="pl-3 flex-grow group-hover:text-gray-300 dark:group-hover:text-gray-800">
        {value.owner.login} / {value.name}
      </div>
      <select onClick={e => e.stopPropagation()} className="dark:bg-gray-600 p-1 pr-8" value={branch} onChange={e => setBranch(e.target.value)}>
        <PagedFetchResult<{ name: string }>
          baseUrl={value.url + "/branches"}
          token={token}
        >
          {({ value: branchValue }) => <option value={branchValue.name}>{branchValue.name}</option>}
        </PagedFetchResult>
      </select>
      <a className="ml-3" target="_blank" rel="noreferrer" href={value.html_url} onClick={e => e.stopPropagation()}>
        <SVGOpenLink className="text-gray-400 hover:text-gray-200" width={16} />
      </a>
    </div>
  )
}


//Abstract to a seperate component
const TokenSelectionListBox = ({ accessTokens, selected, setSelected }: { accessTokens: string[], selected: string, setSelected: (token: string) => void }) => {
  return (
    <div className="w-48" >
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative mt-1 h-8">
          <Listbox.Button className="relative w-48 h-8 pl-3 pr-10 text-left bg-white dark:bg-gray-600 rounded-lg shadow-md cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-orange-300 focus-visible:ring-offset-2 focus-visible:border-indigo-500 sm:text-sm">
            <span className="block truncate"><GithubAccount token={selected} /></span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <SVGChevronDown
                className="w-5 h-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute w-48 py-1 mt-1 overflow-auto text-base bg-white dark:bg-gray-600 rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {accessTokens.map(at => (
                <Listbox.Option
                  key={at}
                  className={({ active }) =>
                    `${active ? 'text-blue-900 bg-blue-100' : 'text-gray-900'} cursor-default select-none relative py-2 pl-4 pr-4`
                  }
                  value={at}
                >
                  {({ selected, active }) => (
                    <>
                      <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate pl-4`}>
                        <GithubAccount token={at} />
                      </span>
                      {selected ? (
                        <span
                          className={`${active ? 'text-green-400' : 'text-green-600'} absolute inset-y-0 left-0 flex items-center pl-2`}
                        >
                          <SVGTick className="w-4 h-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}


const GithubAccount = ({ token }: { token: string }) => {
  const result = useFetchGithubUserDetails(token)

  return (
    <div className="flex flex-row items-center">
      <div className="relative w-[25px] rounded overflow-hidden">
        <Image className="w-full h-full" src={result?.avatar_url ?? '/icons/account_unknown.png'} alt="Profile" width="100%" height="100%" layout="responsive" objectFit="contain" />
      </div>
      <div className="pl-2">{result?.name ?? 'Loading...'}</div>
    </div>
  )
}

export default RemoteRepositoriesDialogBox;