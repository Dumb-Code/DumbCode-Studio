import { useState } from "react"
import { useFetchRequest } from "../studio/util/FetchHooks"
import { useGithubAccessTokens } from "../studio/util/LocalStorageHook"
import { OpenedDialogBox, useOpenedDialogBoxes } from "./DialogBoxes"

const RemoteProjectsDialogBox = () => {
  const [accessTokens] = useGithubAccessTokens()

  const dialogBox = useOpenedDialogBoxes()

  const [selectedAccount, setSelectedAccount] = useState(accessTokens.length === 0 ? '' : accessTokens[0]);

  //Disable typescript warnings for the varibles not being used
  ((a, b) => {})(selectedAccount, setSelectedAccount)

  return (
    <OpenedDialogBox className="w-30 h-30" title={Title}>
      <div className="flex flex-col w-full">
        {accessTokens.length === 0 && <div>No Accounts...</div>}
        {accessTokens.map((at) => <GithubAccount key={at} token={at}/>)}
      </div>
      <button onClick={dialogBox.clear} className="bg-blue-200 rounded border border-black">Close</button>
    </OpenedDialogBox>
  )
}

const GithubAccount = ({token}: {token: string}) => {
  const result = useFetchRequest("https://api.github.com/user", token)

  return (
    <div className="flex flex-row items-center justify-center">
      <div className="pl-3"><img width={25} src={result?.avatar_url ?? ''} alt="Profile" /></div>
      <div className="pl-3">{result?.name ?? 'Loading...'}</div>
    </div>
  )
}


const Title = () => {
  return (
    <div>Load a Repository</div>
  )
}

export default RemoteProjectsDialogBox
