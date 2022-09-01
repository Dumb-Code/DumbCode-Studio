import { Dispatch, FormEvent, SetStateAction, useCallback, useMemo, useState } from "react"
import { RemoteRepo } from "../studio/formats/project/DcRemoteRepos"
import GithubCommiter from "../studio/git/GithubCommiter"
import { useListenableObjectNullable } from "../studio/listenableobject/ListenableObject"
import { useGithubAccessToken } from "../studio/util/LocalStorageHook"
import Checkbox from "./Checkbox"

const GithubCommitBox = ({ deleteRemote, setDeleteRemote, repo, processCommit, onCommitFinished }: { deleteRemote?: boolean, setDeleteRemote?: Dispatch<SetStateAction<boolean>>, repo: RemoteRepo | null, processCommit: (commiter: GithubCommiter) => any | Promise<any>, onCommitFinished?: () => void }) => {
  const [message, setMessage] = useState("")
  const [description, setDescription] = useState("")

  const [currentCommit, setCurrentCommit] = useState<GithubCommiter | null>(null)
  const [commitMsg] = useListenableObjectNullable(currentCommit?.message)

  const [token] = useGithubAccessToken()

  const messageValid = useMemo(() => message.length !== 0, [message])

  const onMessageInput = useCallback((e: FormEvent<HTMLInputElement>) => setMessage(e.currentTarget.value ?? ""), [])
  const onDescInput = useCallback((e: FormEvent<HTMLTextAreaElement>) => setDescription(e.currentTarget.value ?? ""), [])

  const onClickButton = useCallback(async () => {
    if (repo === null || token === null) {
      return
    }
    const github = new GithubCommiter(token, repo)
    setCurrentCommit(github)
    await processCommit(github)
    const success = await github.commit(message, description)
    if (success && onCommitFinished) {
      onCommitFinished()
    }

  }, [message, description, processCommit, onCommitFinished, token, repo])

  { /* extract the number of commit steps done and divide by num commit stages*/ }
  const effectiveStatus = Math.random() * 100;

  return (
    <div className="w-full flex-col">
      <p className="font-semibold">Push your changes to your Remote:</p>
      <div className="h-4 text-gray-500 text-xs">{commitMsg}</div>
      <div className={(effectiveStatus === 100 || effectiveStatus <= 0) ? "hidden" : "overflow-hidden h-2 text-xs flex rounded bg-gray-200 flex-grow my-2"}>
        <div style={{ width: Math.max(effectiveStatus, 0) + "%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
      </div>
      { /* //TODO Make this use the validated input component so that it matches. @wyn plz*/}
      <input className={"dark:bg-gray-700 rounded w-full mb-1 px-2 py-1 focus:px-2 focus:py-1" + (messageValid || " ring-1 ring-red-600")} value={message} onInput={onMessageInput} placeholder="Commit Message (required)" />
      <textarea className="dark:bg-gray-700 rounded w-full border-0 focus:ring-2 mb-2 py-1 px-2" value={description} onInput={onDescInput} placeholder="Commit Description" />

      <div className="flex flex-row">
        {setDeleteRemote !== undefined && <Checkbox enabledColor="bg-red-500" value={deleteRemote} setValue={setDeleteRemote} extraText="Mark Deleted" />}
        <div className="flex-grow"></div>
        <button className={(messageValid ? "bg-blue-600 hover:bg-blue-500" : " bg-gray-200 text-white dark:text-black dark:bg-gray-700 cursor-not-allowed") + " py-1 px-16 rounded text-xs"} disabled={!messageValid} onClick={onClickButton}>
          Commit
        </button>
      </div>
    </div>
  )
}

export default GithubCommitBox