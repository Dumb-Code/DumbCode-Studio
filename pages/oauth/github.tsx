import { NextPage } from "next"
import Head from "next/head"
import { useEffect, useState } from "react"

const GithubAuthPage: NextPage = () => {
  const [error, setError] = useState("")
  const [errorDesc, setErrorDesc] = useState("")

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code")
    const state = localStorage.getItem("github-state")
    localStorage.removeItem("github-state")
    if (state === null) {
      setError("No Internal State. Invalid Call.")
      return
    }
    const stateIn = urlParams.get("state")
    if (stateIn === null) {
      setError("No External State. Invalid Call.")
      return
    }
    if (stateIn !== state) {
      setError("Unequal State. Invalid Call. ")
      setErrorDesc(`${stateIn}--${state}`)
      return
    }
    fetch(`${window.location.protocol}//${window.location.host}/api/oauth/github?code=${code}`)
      .then(v => v.json())
      .then(j => {
        if (j.token) {
          localStorage.setItem("github-access-token", j.token)
          window.close()
          return
        }
        if (j.error) {
          setError(j.error)
          setErrorDesc(j.error_description)
        }
      })
  }, [])

  return (
    <div className="bg-gray-800 m-auto h-screen">
      <Head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Github HTML Auth</title>
      </Head>
      <h1 className="text-white">Authorizing DumbCode...</h1>
      <h2 id="error" className="text-red-600">{error}</h2>
      <p id="error_desc" className="text-red-600">{errorDesc}</p>

    </div>
  )
}

export default GithubAuthPage