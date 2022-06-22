import { createContext, PropsWithChildren, useContext } from "react"

const Context = createContext<string | null>(null)

const GithubApplicationContext = ({ githubClientId, children }: PropsWithChildren<{
  githubClientId: string
}>) => {
  return (
    <Context.Provider value={githubClientId}>
      {children}
    </Context.Provider>
  )
}

export const useGithubClientId = () => {
  const context = useContext(Context)
  if (context === null) {
    throw new Error("Context must be used between providers")
  }
  return context
}


export default GithubApplicationContext