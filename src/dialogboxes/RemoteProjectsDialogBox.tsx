import { Listbox, Transition } from "@headlessui/react"
import { Fragment, useState } from "react"
import { SVGChevronDown, SVGOpenLink, SVGPlus } from "../components/Icons"
import PagedFetchResult from "../components/PagedFetchResult"
import { useFetchGithubUserDetails } from "../studio/util/FetchHooks"
import { useGithubAccessTokens } from "../studio/util/LocalStorageHook"
import { OpenedDialogBox, useOpenedDialogBoxes } from "./DialogBoxes"

const RemoteProjectsDialogBox = () => {
  const [accessTokens] = useGithubAccessTokens()

  const dialogBox = useOpenedDialogBoxes()

  const [selectedAccount, setSelectedAccount] = useState(accessTokens.length === 0 ? '' : accessTokens[0]);

  const [search, setSearch] = useState("")

  return (
    <OpenedDialogBox width="800px" height="800px" title={Title}>
      <div className="flex flex-col h-full">
        <div className="flex flex-row w-full justify-center items-center">
          <TokenSelectionListBox accessTokens={accessTokens} selected={selectedAccount} setSelected={setSelectedAccount} />
          <input value={search} onChange={e => setSearch(e.target.value)} className="flex flex-grow ml-5 p-0 h-8 dark:bg-gray-500 rounded dark:placeholder-gray-800" type="text" placeholder="Search Repositories" />
        </div>
        <div className="flex-grow overflow-y-auto h-0 mt-2 mb-2 bg-gray-300 dark:bg-gray-700">
          <RepositoryList search={search.toLowerCase()} token={selectedAccount} />
        </div>
        <button onClick={dialogBox.clear} className="bg-blue-200 rounded border border-black text-black">Close</button>
      </div>
    </OpenedDialogBox>
  )
}

const RepositoryList = ({token, search}: {token: string, search: string}) => {
  return (
    <PagedFetchResult
      baseUrl="https://api.github.com/user/repos"
      token={token}
      predicate={r => search.split(" ").some(s => r.owner.login.toLowerCase().includes(s) || r.name.toLowerCase().includes(s))}
      loading={() => <div className="flex flex-col justify-center items-center">Loading...</div>}
    >
      {({ value }) =>
        <div className="group border-t border-b border-black flex flex-row p-2 items-center hover:bg-gray-500">
          <img className="rounded border border-black" width={40} src={value.owner.avatar_url ?? ''} alt="Profile" />
          <div className="pl-3 flex-grow group-hover:text-gray-300 dark:group-hover:text-gray-800">
            {value.owner.login} / {value.name}
          </div>
          <a className="ml-3" target="_blank" rel="noreferrer" href={value.html_url} onClick={e=>e.stopPropagation()}>
            <SVGOpenLink className="text-gray-400 hover:text-gray-200" width={16}/>
          </a>
        </div>
      }
    </PagedFetchResult>
  )
}


const TokenSelectionListBox = ({accessTokens, selected, setSelected}: {accessTokens: string[], selected: string, setSelected: (val: string) => void}) =>  {
  return (
    <div >
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative mt-1">
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
                          {/* Should be a tick */}
                          <SVGPlus className="w-5 h-5" aria-hidden="true" />
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


const GithubAccount = ({token}: {token: string}) => {
  const result = useFetchGithubUserDetails(token)

  return (
    <div className="flex flex-row items-center">
      <img className="rounded" width={25} src={result?.avatar_url ?? ''} alt="Profile" />
      <div className="pl-2">{result?.name ?? 'Loading...'}</div>
    </div>
  )
}


const Title = () => {
  return (
    <div className="text-2xl mb-5">Load a Repository</div>
  )
}

export default RemoteProjectsDialogBox;