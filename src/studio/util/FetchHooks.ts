import { useEffect } from 'react';
import { useState } from 'react';
export const useFetchRequest = (url: string, token: string) => {
  const [result, setResult] = useState<any>()
  useEffect(() => {
    fetch(url, {
      headers: { 
        "Authorization": `token ${token}`
      }
    })
  .then(j => j.json())
  .then(j => setResult(j))
  }, [url, token])
  return result
}