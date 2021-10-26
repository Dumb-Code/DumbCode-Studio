import { useCallback, useEffect, useRef, useState } from "react"
import { useFetchRequest } from "../studio/util/FetchHooks"

type PagedProps = {
  baseUrl: string,
  token: string | null,
  connector?: string,
  children: ({ value }) => JSX.Element,
  loading?: () => JSX.Element,
  error?: (status: number) => JSX.Element,
  predicate?: (val: any) => boolean,
  empty?: () => JSX.Element
}

const PagedFetchResult = (props: PagedProps) => {
  const [requestedPages, setRequestedPages] = useState([1])
  const requestNext = useCallback((id: number) => {
    if (id === requestedPages.length) {
      setRequestedPages([...requestedPages, id + 1])
    }
  }, [requestedPages])

  return (
    <>
      {requestedPages.map(p =>
        <Page
          key={p}
          page={p}
          requestNext={() => requestNext(p)}
          {...props}
        />
      )}
    </>
  )
}

const Page = ({ baseUrl, token, connector = "?", page, children: Renderer, requestNext, loading, predicate, error, empty }: PagedProps & { page: number, requestNext: () => void }) => {
  const result = useFetchRequest(`${baseUrl}${connector}page=${page}&per_page=30`, token)
  const hasRequested = useRef(false)
  useEffect(() => {
    if (result.status === 200 && !hasRequested.current && result.result.length === 30) {
      hasRequested.current = true
      requestNext()
    }
  }, [result, requestNext])

  if (result.status === -1) {
    return loading ? loading() : <></>
  }

  if (result.status !== 200) {
    return error ? error(result.status) : <></>
  }

  if (page === 1 && result.result.length === 0) {
    return empty ? empty() : <></>
  }

  return (
    <>
      {result
        .result
        .filter(r => !predicate || predicate(r))
        .map((r, i) => <Renderer key={i} value={r} />)
      }
    </>
  )
}

export default PagedFetchResult