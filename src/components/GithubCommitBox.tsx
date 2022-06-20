import { FormEvent, useCallback, useMemo, useState } from "react"
import { RemoteRepo } from "../studio/formats/project/DcRemoteRepos"
import GithubCommiter from "../studio/git/GithubCommiter"
import { useListenableObjectNullable } from "../studio/util/ListenableObject"
import { useGithubAccessToken } from "../studio/util/LocalStorageHook"
import { ButtonWithTooltip } from "./Tooltips"

const GithubCommitBox = ({ repo, processCommit, onCommitFinished }: { repo: RemoteRepo | null, processCommit: (commiter: GithubCommiter) => any | Promise<any>, onCommitFinished?: () => void }) => {
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
    await github.commit(message, description)
    if (onCommitFinished) {
      onCommitFinished()
    }

  }, [message, description, processCommit, onCommitFinished, token, repo])

  return (
    <div className="w-full flex-col">
      <div className="text-red-500 h-7">{commitMsg}</div>
      <input className="dark:bg-gray-700 rounded w-full" value={message} onInput={onMessageInput} placeholder="Commit Message (required)" />
      <textarea className="dark:bg-gray-700 rounded w-full" value={description} onInput={onDescInput} placeholder="Commit Description" />
      <ButtonWithTooltip tooltip={messageValid ? "Execute Commit" : "Commit Message Required"} disabled={!messageValid} onClick={onClickButton}>
        Commit
      </ButtonWithTooltip>
    </div>
  )
}

export default GithubCommitBox