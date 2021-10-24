import { useEffect } from 'react';
import { useState } from 'react';

const responseCache = new Map<string, any>()

export const useFetchRequest = (url: string, token: string) => {
  const cacheKey = url + "#" + token
  const cachedResult = responseCache.has(cacheKey) ? responseCache.get(cacheKey) : null
  const [result, setResult] = useState<any | null>(cachedResult)
  useEffect(() => {
    if(cachedResult !== null) {
      return
    }
    fetch(url, {
      headers: { 
        "Authorization": `token ${token}`
      }
    })
  .then(j => j.json())
  .then(j => {
    responseCache.set(cacheKey, j)
    setResult(j)
  })
  }, [url, token, cacheKey, cachedResult])
  return result
}

export const useFetchGithubUserDetails = (token: string) => useFetchRequest("https://api.github.com/user", token)