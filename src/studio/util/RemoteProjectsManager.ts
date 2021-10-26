import { RemoteRepo, remoteRepoEqual } from '../formats/project/DcRemoteRepos';
import { useLocalStorage } from './LocalStorageHook';

const localStorageKey = "github-recent-remote-projects"

const tryParseArray = (item: string | null) => {
  if (item !== null) {
    try {
      return JSON.parse(item) as []
    } catch (e) {
      console.warn(`Unable to parse '${item}' as json array`, e)
    }
  }
  return null
}

export const getRecentGithubRemoteProjects = () => {
  const list: RemoteRepo[] = []
  const parsed = tryParseArray(localStorage.getItem(localStorageKey))
  if (parsed !== null) {
    list.push(...parsed)
  }
  return list
}

export const addRecentGithubRemoteProject = (project: RemoteRepo) => {
  const list = getRecentGithubRemoteProjects()
  const filtered = list.filter(p => !remoteRepoEqual(project, p))
  filtered.unshift(project)
  localStorage.setItem(localStorageKey, JSON.stringify(filtered))
}

export const removeRecentGithubRemoteProject = (project: RemoteRepo) => {
  const list = getRecentGithubRemoteProjects()
  const filtered = list.filter(p => !remoteRepoEqual(project, p))
  localStorage.setItem(localStorageKey, JSON.stringify(filtered))
}

export const useRecentGithubRemoteProjects = () => {
  const [item] = useLocalStorage(localStorageKey)
  return tryParseArray(item) ?? []
}