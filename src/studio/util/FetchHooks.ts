import { useMemo } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { NewLineKind } from 'typescript';

const responseCache = new Map<string, any>()

export const useFetchRequest = (url: string, token: string) => {
  const cacheKey = url + "#" + token
  const cachedResult = useMemo(() =>  responseCache.has(cacheKey) ? responseCache.get(cacheKey) : null, [cacheKey])
  const [result, setResult] = useState<any | null>(cachedResult)
  useEffect(() => {
    if(cachedResult === null) {
      
    }
    fetch(url, {
      headers: { 
        "Authorization": `token ${token}`
      }
    })
  .then(j => j.json())
  .then(j => {
    responseCache.set(cacheKey, j)
    console.log(responseCache)
    setResult(j)
  })
  }, [url, token])
  return result
}

export const useFetchGithubUserDetails = (token: string) => useFetchRequest("https://api.github.com/user", token)