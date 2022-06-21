import { Octokit } from "@octokit/rest"
import GithubCommiter from "../../git/GithubCommiter"
import { LO } from "../../util/ListenableObject"

const path_StudioRemoteBase = ".studio_remote.json"
export const writeStudioRemote = (commiter: GithubCommiter, projects: readonly RemoteProjectEntry[]) => {
  commiter.pushChange(path_StudioRemoteBase, JSON.stringify(projects, null, 2))
}
type ContentReturnType = Promise<
  { type: "file", name: string, content: string } |
  { type: "dir", files: { name: string, path: string }[] } |
  { type: "other" }
>

export default interface DcRemoteRepo {
  readonly repo: RemoteRepo
  readonly projects: LO<readonly RemoteProjectEntry[]>

  readonly createCounter: (total: number) => DcRemoteRepoContentGetterCounter

  readonly getContent: (path: string, decodeBase64?: boolean) => ContentReturnType
}

export type DcRemoteRepoContentGetterCounter = {
  readonly allData: DcRemoteRepo
  readonly repo: RemoteRepo
  readonly getContent: (path: string, decodeBase64?: boolean) => ContentReturnType
  readonly addListener: (func: (value: number, total: number) => void) => void
  readonly removeListener: (func: (value: number, total: number) => void) => void
  readonly addUnforseenRequests: (totalToAdd: number) => void
}

const tryParseArray = (item: string | null) => {
  if (item !== null) {
    try {
      return JSON.parse(item) as []
    } catch (e) {
      console.warn(`Unable to parse '${item}' as json array`, e)
    }
  }
  return []
}

export const loadDcRemoteRepo = async (token: string, repo: RemoteRepo): Promise<DcRemoteRepo> => {
  const octokit = new Octokit({
    auth: token
  })
  const getContent = (path: string) => octokit.rest.repos.getContent({
    owner: repo.owner,
    repo: repo.repo,
    path,
    ref: repo.branch,
  }).catch(() => { }) //Ignore

  const studioRootFile = await getContent(path_StudioRemoteBase)
  const studioRoots: readonly RemoteProjectEntry[] = studioRootFile && "content" in studioRootFile.data ? tryParseArray(Buffer.from(studioRootFile.data.content, 'base64').toString("utf-8")) : []


  const ret: DcRemoteRepo = {
    repo,
    projects: new LO(studioRoots),
    createCounter: total => getCountedContentGetter(total, ret),
    getContent: async (path, base64 = false) => {
      const result = await getContent(path)
      if (!result) {
        return { type: "other" }
      }
      if ("content" in result.data) {
        return {
          type: "file",
          name: result.data.name,
          content: base64 ? result.data.content : Buffer.from(result.data.content, 'base64').toString()
        }
      }
      if (Array.isArray(result.data)) {
        const array = result.data.map(d => {
          return {
            name: d.name,
            path: d.path
          }
        })
        return {
          type: "dir",
          files: array
        }
      }
      return { type: "other" }
    }
  }
  return ret
}

const getCountedContentGetter: (total: number, repo: DcRemoteRepo) => DcRemoteRepoContentGetterCounter = (total, repo) => {
  let counter = 0;
  const counterListeners = new Set<(value: number, total: number) => void>()

  return {
    allData: repo,
    repo: repo.repo,
    addUnforseenRequests: t => {
      total += t
      counterListeners.forEach(l => l(counter, total))
    },
    addListener: func => counterListeners.add(func),
    removeListener: func => counterListeners.delete(func),
    getContent: (path, decodeBase64) => repo.getContent(path, decodeBase64).then(r => {
      counter++
      counterListeners.forEach(l => l(counter, total))
      return r
    })
  }

}

export type RemoteRepo = {
  owner: string,
  repo: string,
  branch: string,
}

export const remoteRepoEqual = (repo1: RemoteRepo, repo2: RemoteRepo) =>
  repo1.owner === repo2.owner &&
  repo1.repo === repo2.repo &&
  repo1.branch === repo2.branch

export type RemoteProjectEntry = {
  readonly version: number,
  readonly uuid: string
  readonly name: string,
  readonly model: string
  readonly texture?: {
    readonly baseFolder: string
    readonly groups: readonly {
      readonly folderName: string
      readonly groupName: string
      readonly textures: readonly string[]
    }[]
  }
  readonly animationFolder?: string
  readonly referenceImages?: readonly {
    readonly name: string
    readonly opacity: number
    readonly canSelect: boolean
    readonly hidden: boolean
    readonly position: readonly [number, number, number]
    readonly rotation: readonly [number, number, number]
    readonly scale: number,
    readonly flipX: boolean,
    readonly flipY: boolean,
    readonly data: string
  }[]
}
