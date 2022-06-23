import { Dispatch, FormEvent, SetStateAction, useCallback, useMemo, useState } from "react"
import { RemoteRepo } from "../studio/formats/project/DcRemoteRepos"
import GithubCommiter from "../studio/git/GithubCommiter"
import { useListenableObjectNullable } from "../studio/util/ListenableObject"
import { useGithubAccessToken } from "../studio/util/LocalStorageHook"
import Checkbox from "./Checkbox"

const GithubCommitBox = ({ deleteRemote, setDeleteRemote, repo, processCommit, onCommitFinished }: { deleteRemote: boolean, setDeleteRemote: Dispatch<SetStateAction<boolean>>, repo: RemoteRepo | null, processCommit: (commiter: GithubCommiter) => any | Promise<any>, onCommitFinished?: () => void }) => {
  const [message, setMessage] = useState("")
  const [description, setDescription] = useState("")

  const [currentCommit, setCurrentCommit] = useState<GithubCommiter | null>(null)
  const [commitMsg] = useListenableObjectNullable(currentCommit?.message, [currentCommit])

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

  return (
    <div className="w-full flex-col">
      <p className="font-semibold mb-2">Push your changes to your Remote:</p>
      { /*<div className="text-red-500 h-7">{commitMsg}</div> */}
      { /* //TODO Make this use the validated input component so that it matches. @wyn plz*/}
      <input className={"dark:bg-gray-700 rounded w-full mb-1 px-2 py-1" + (messageValid || " ring-1 ring-red-600")} value={message} onInput={onMessageInput} placeholder="Commit Message (required)" />
      <textarea className="dark:bg-gray-700 rounded w-full border-0 focus:ring-2 mb-2 py-1 px-2" value={description} onInput={onDescInput} placeholder="Commit Description" />

      <div className="flex flex-row">
        <Checkbox enabledColor="bg-red-500" value={deleteRemote} setValue={setDeleteRemote} extraText="Mark Deleted" />
        <div className="flex-grow"></div>
        <button className={(messageValid ? "bg-blue-600 hover:bg-blue-500" : "") + " py-1 px-16 rounded text-xs"} disabled={!messageValid} onClick={onClickButton}>
          Commit
        </button>
      </div>
    </div>
  )
}

export default GithubCommitBox