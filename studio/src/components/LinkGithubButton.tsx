import { SVGGithub } from "@dumbcode/shared/icons"
import { useGithubClientId } from "../contexts/ServersideContext"

const LinkGithubButton = () => {

  const githubClientId = useGithubClientId()

  const linkGH = () => {
    const state = (Math.random() + 1).toString(36)
    localStorage.setItem("github-state", state)
    window.open(`https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=repo&state=${state}`, "Auth Github", "width=500,height=500")
  }

  return (
    <button onClick={linkGH} className="relative inline-block text-right text-white bg-gray-800 hover:bg-purple-600 px-4 py-1 rounded mt-0.5">
      <div className="m-auto flex flex-row">
        <SVGGithub width="20px" /> <span className="px-2 text-sm">Sign in with Github</span>
      </div>
    </button>
  )
}

export default LinkGithubButton