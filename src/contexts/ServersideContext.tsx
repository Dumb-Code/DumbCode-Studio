import { createContext, PropsWithChildren, useContext, useMemo } from "react";

const Context = createContext<{
  readonly githubClientId: string;
  readonly gitCommitMessage: string;
} | null>(null)

const ServersideContext = ({ githubClientId, gitCommitMessage, children }: PropsWithChildren<{
  githubClientId: string
  gitCommitMessage: string
}>) => {
  const value = useMemo(() => ({
    gitCommitMessage, githubClientId
  }), [])
  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  )
}

export const useServersideContext = () => {
  const context = useContext(Context)
  if (context === null) {
    throw new Error("Context must be used between providers")
  }
  return context
}

export const useGithubClientId = () => useServersideContext().githubClientId
export const useGitCommitMessage = () => useServersideContext().gitCommitMessage

export default ServersideContext