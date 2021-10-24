import { useCallback, useEffect, useRef, useState } from "react"
import { useFetchRequest } from "../studio/util/FetchHooks"

const PagedFetchResult = ({baseUrl, token, connector="?", children, loading, predicate}: {baseUrl: string, token: string, connector?: string, children: ({value}) => JSX.Element, loading?: () => JSX.Element, predicate?: (val: any) => boolean}) => {
  const [requestedPages, setRequestedPages] = useState([1])
  const requestNext = useCallback((id: number) => {
    if(id === requestedPages.length) {
      setRequestedPages([...requestedPages, id+1])
    }
  }, [requestedPages])

  return (
    <>
      {requestedPages.map(p => 
        <Page key={p} 
          baseUrl={baseUrl} 
          token={token} 
          connector={connector} 
          page={p} 
          Renderer={children} 
          requestNext={() => requestNext(p)}
          loading={loading}
          predicate={predicate}
        />
      )}
    </>
  )
}

const Page = ({baseUrl, token, connector, page, Renderer, requestNext, loading, predicate}: {baseUrl: string, token: string, connector: string, page: number, Renderer: ({value}) => JSX.Element, requestNext: () => void, loading?: () => JSX.Element, predicate?: (val: any) => boolean}) => {
  const result = useFetchRequest(`${baseUrl}${connector}page=${page}`, token)
  const hasRequested = useRef(false)
  useEffect(() => {
    if(result !== null && result.length !== 0 && !hasRequested.current) {
      hasRequested.current = true
      requestNext()
    }
  }, [result, requestNext])

  if(result === null) {
    return loading ? loading() : <></>
  }

  return (
    <>
      {result
        .filter(r => !predicate || predicate(r) )
        .map((r, i) => <Renderer key={i} value={r}/>)
      }
    </> 
  )
}

export default PagedFetchResult