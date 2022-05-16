import { Octokit } from "@octokit/rest"

const path_StudioRemoteBase = ".studio_remote.json"

type ContentReturnType = Promise<
  { type: "file", name: string, content: string } |
  { type: "dir", files: { name: string, path: string }[] } |
  { type: "other" }
>

export default interface DcRemoteRepo {
  readonly repo: RemoteRepo
  readonly projects: RemoteProjectEntry[]

  readonly createCounter: (total: number) => DcRemoteRepoContentGetterCounter

  readonly getContent: (path: string, decodeBase64?: boolean) => ContentReturnType
}

export type DcRemoteRepoContentGetterCounter = {
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
  const studioRoots: RemoteProjectEntry[] = studioRootFile && "content" in studioRootFile.data ? tryParseArray(atob(studioRootFile.data.content)) : []


  const ret: DcRemoteRepo = {
    repo,
    projects: studioRoots,
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
          content: base64 ? result.data.content : atob(result.data.content)
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
  uuid: string
  name: string,
  model: string
  texture?: {
    baseFolder: string
    groups: {
      folderName: string
      groupName: string
      textures: string[]
    }[]
  }
  animationFolder?: string
  referenceImages?: {
    name: string
    position: { x: number, y: number, z: number }
    rotation: { x: number, y: number, z: number }
    scale: { x: number, y: number, z: number }
    data: string
  }[]
}
