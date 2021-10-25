import { useLocalStorage } from './LocalStorageHook';

export type RemoteProject = {
  owner: string,
  repo: string,
  token: string,
  branch: string,
}

const localStorageKey = "github-recent-remote-projects"

const tryParse = (item: string | null) => {
  if(item !== null) {
    try {
      return JSON.parse(item) as RemoteProject[]
    } catch(e) {
      console.warn(`Unable to parse '${item}' as json array`, e)
    }
  }
  return null
}



export const getRecentGithubRemoteProjects = () => {
  const list: RemoteProject[] = []
  const parsed = tryParse(localStorage.getItem(localStorageKey))
  if(parsed !== null) {
    list.push(...parsed)
  }
  return list
}

export const addRecentGithubRemoteProject = (project: RemoteProject) => {
  const list = getRecentGithubRemoteProjects()
  const filtered = list.filter(p => p.owner!==project.owner || p.repo!==project.repo || p.token!==project.token || p.branch!==project.branch)
  filtered.unshift(project)
  localStorage.setItem(localStorageKey, JSON.stringify(filtered))
}

export const removeRecentGithubRemoteProject = (project: RemoteProject) => {
  const list = getRecentGithubRemoteProjects()
  const filtered = list.filter(p => p.owner!==project.owner || p.repo!==project.repo || p.token!==project.token || p.branch!==project.branch)
  localStorage.setItem(localStorageKey, JSON.stringify(filtered))
}

export const useRecentGithubRemoteProjects = () => {
  const [item] = useLocalStorage(localStorageKey)
  return tryParse(item) ?? []
}