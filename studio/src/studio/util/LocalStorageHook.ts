import { useCallback, useEffect, useState } from 'react';

const useActualLocalStorage = (key: string) => {
  const [storage, _setStorage] = useState(localStorage.getItem(key))

  const setStorage = useCallback((value: string | null) => {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
    _setStorage(value)
  }, [key])

  useEffect(() => {
    const interval = setInterval(() => {
      const current = localStorage.getItem(key)
      if (storage !== current) {
        setStorage(current)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [key, storage, setStorage])

  return [storage, setStorage] as const
}

const useDummyLocalStorage = (key: string) => {
  return useState<string | null>(null)
}

export const useLocalStorage = typeof window !== "undefined" ? useActualLocalStorage : useDummyLocalStorage

export const useGithubAccessToken = () => {
  const [github, setGithub] = useLocalStorage("github-access-token")
  const remove = useCallback(() => setGithub(null), [setGithub])
  return [github, remove] as const
}