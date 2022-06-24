import { Menu, Transition } from "@headlessui/react"
import Image from "next/image"
import { Fragment } from "react"
import { useGithubClientId } from "../contexts/GithubApplicationContext"
import { useFetchGithubUserDetails } from "../studio/util/FetchHooks"
import { useGithubAccessToken } from "../studio/util/LocalStorageHook"
import { SVGOpenLink } from "./Icons"
import LinkGithubButton from "./LinkGithubButton"

const GithubAccountButton = () => {
  const [accessToken, removeToken] = useGithubAccessToken()

  return (
    <>
      {accessToken === null ? <LinkGithubButton /> : <SignedInToGithub accessToken={accessToken} removeToken={removeToken} />}
    </>
  )
}

const SignedInToGithub = ({ accessToken, removeToken }: { accessToken: string, removeToken: () => void }) => {

  const result = useFetchGithubUserDetails(accessToken)
  const githubClientId = useGithubClientId()

  return (
    <div>
      <Menu as="div" className="relative inline-block text-right w-60">
        <Menu.Button>
          <div className="text-right mt-[1px]">
            {result !== null && <Image className="rounded-full" width={30} height={30} src={result.avatar_url} alt="Profile" />}
          </div>
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="bg-gray-200 dark:bg-gray-900 rounded mt-1 p-1 shadow-sm border border-black text-black dark:text-white text-center">
            <div className="px-1 py-1">
              <Menu.Item>
                <div>
                  <p className="text-xs text-black dark:text-gray-300 pb-1 text-left">Logged in as:</p>
                  <div className="pl-3 flex-grow truncate bg-gray-400 dark:bg-gray-700 rounded px-4 py-1 ">{result?.name ?? 'Loading...'}</div>
                </div>
              </Menu.Item>
            </div>
            <div className="px-1 py-1 border-t">
              <Menu.Item>
                <a target="_blank" className="bg-gray-400 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-1 rounded cursor-pointer flex flex-row justify-center items-center mb-1" rel="noopener noreferrer" href={`https://github.com/settings/connections/applications/${githubClientId}`}>
                  Review Access
                  <SVGOpenLink className="ml-2 w-4 h-4" />
                </a>
              </Menu.Item>
              <Menu.Item>
                <div className="flex flex-row bg-red-500 dark:bg-red-700 hover:bg-red-600 px-4 py-1 rounded cursor-pointer" onClick={removeToken}>
                  <p className="w-full">Logout</p>
                </div>
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}


export default GithubAccountButton 
