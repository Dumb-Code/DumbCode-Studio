import { useState } from 'react';
import { useEffect } from 'react';

export const useLocalStorage = (key: string) => {
  const [storage, setStorage] = useState(localStorage.getItem(key))

  useEffect(() => {
    const interval = setInterval(() => {
      const current = localStorage.getItem(key)
      if (storage !== current) {
        setStorage(current)
      }
    }, 100)
    return () => clearInterval(interval)
  })

  return [storage, (value: string) => { localStorage.setItem(key, value); setStorage(value) }] as [string, (val: string) => void]
}

export const useGithubAccessTokens = () => {
  const [tokenString, setTokenString] = useLocalStorage("github-access-tokens")
  let accessTokens: string[] = []

  if (tokenString !== null) {
    try {
      const arr = JSON.parse(tokenString) as string[]
      arr.forEach(a => accessTokens.push(a))
    }
    catch {
      console.warn("Unable to parse " + tokenString + " as json array.")
    }
  }

  return [accessTokens, (val: string[]) => setTokenString(JSON.stringify(val))] as [string[], (val: string[]) => void]
}