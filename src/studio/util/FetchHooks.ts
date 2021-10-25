import { useEffect } from 'react';
import { useState } from 'react';

const responseCache = new Map<string, FetchResponse>()

type FetchResponse = {
  status: number,
  result?: any,
}

const emptyResponse: FetchResponse = { status: -1 }

export const useFetchRequest = (url: string, token: string | null) => {
  const cacheKey = url + "#" + token
  const cachedResult = responseCache.get(cacheKey) ?? emptyResponse
  const [result, setResult] = useState<FetchResponse>(cachedResult)
  useEffect(() => {
    if(cachedResult.status !== -1) {
      return
    }
    fetch(url, {
      headers: token ? { 
        "Authorization": `token ${token}`
      } : {}
    })
  .then(r => {
    if(r.ok) {
      return r.json()
      .then(j => {
        return {
          status: 200,
          result: j
        }
      })
    }
    return { status: r.status } as FetchResponse
  })
  .then(r => {
    responseCache.set(cacheKey, r)
    setResult(r)
  })
  }, [url, token, cacheKey, cachedResult])
  return result
}

export const useFetchGithubUserDetails = (token: string) => {
  const val = useFetchRequest("https://api.github.com/user", token)
  return val.result ?? null
}