import { RestEndpointMethodTypes } from '@octokit/rest';
import { useEffect, useState } from 'react';

const responseCache = new Map<string, FetchResponse>()

type FetchResponse = {
  status: number,
  result?: any,
}

const emptyResponse: FetchResponse = { status: -1 }

export const useFetchRequest = (url: string, token: string | null, shouldRun = true) => {
  const cacheKey = url + "#" + token
  const cachedResult = responseCache.get(cacheKey) ?? emptyResponse
  const [result, setResult] = useState<FetchResponse>(cachedResult)
  useEffect(() => {
    if (!shouldRun) {
      return
    }
    if (cachedResult.status !== -1) {
      return
    }
    const controller = new AbortController()
    fetch(url, {
      headers: token ? {
        "Authorization": `token ${token}`
      } : {},
      signal: controller.signal
    })
      .then(r => {
        if (r.ok) {
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
      .catch(() => { })
    return () => controller.abort()
  }, [url, token, cacheKey, cachedResult, shouldRun])
  return result
}

export const useFetchGithubUserDetails = (token: string | null): RestEndpointMethodTypes['users']['getAuthenticated']['response']['data'] | null => {
  const val = useFetchRequest("https://api.github.com/user", token, token !== null).result
  return val ?? null
}