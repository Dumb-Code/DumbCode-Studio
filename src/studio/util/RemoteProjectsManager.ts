import { useCallback } from 'react';
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

export const useRecentGithubRemoteProjects = (): [RemoteRepo[], (setUsed: RemoteRepo) => void, () => void] => {
  const [item, setItem] = useLocalStorage(localStorageKey)
  const items: RemoteRepo[] = tryParseArray(item) ?? []

  const save = useCallback(() => {
    setItem(JSON.stringify(items))
  }, [items, setItem])

  const setUsed = useCallback((repo: RemoteRepo) => {
    const filtered = items.filter(i => i !== repo)
    filtered.unshift(repo)
    setItem(JSON.stringify(filtered))
  }, [save, items, setItem])

  return [
    items,
    setUsed,
    save
  ]
}