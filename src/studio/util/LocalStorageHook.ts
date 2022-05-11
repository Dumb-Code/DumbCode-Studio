import { useCallback, useEffect, useState } from 'react';

export const useLocalStorage = (key: string) => {
  const [storage, _setStorage] = useState(localStorage.getItem(key))

  useEffect(() => {
    const interval = setInterval(() => {
      const current = localStorage.getItem(key)
      if (storage !== current) {
        setStorage(current)
      }
    }, 100)
    return () => clearInterval(interval)
  })

  const setStorage = useCallback((value: string | null) => {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
    _setStorage(value)
  }, [])

  return [storage, setStorage] as const
}

export const useGithubAccessToken = () => {
  const [github, setGithub] = useLocalStorage("github-access-token")
  const [dumbcode, setDumbcode] = useLocalStorage("dumbcode-access-token")

  const removeAll = useCallback(() => {
    setGithub(null)
    setDumbcode(null)
  }, [])
  return [github, dumbcode, removeAll] as const
}