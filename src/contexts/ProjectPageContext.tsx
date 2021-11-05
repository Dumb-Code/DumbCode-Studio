import { createContext, FC, useContext, useState } from "react";
import DcRemoteRepo from "../studio/formats/project/DcRemoteRepos";

type ProjectPageContextType = {
  remoteSettingsOpen: boolean,
  setRemoteSettingsOpen: (value: boolean) => void

  selectedRepo: DcRemoteRepo | null,
  setSelectedRepo: (value: DcRemoteRepo) => void
}

const Context = createContext<ProjectPageContextType | null>(null)

const ProjectPageContextProvider: FC = ({ children }) => {
  const [remoteSettingsOpen, setRemoteSettingsOpen] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<DcRemoteRepo | null>(null)
  return (
    <Context.Provider value={{ remoteSettingsOpen, setRemoteSettingsOpen, selectedRepo, setSelectedRepo }}>
      {children}
    </Context.Provider>
  )
}

export const useProjectPageContext = () => {
  const context = useContext(Context)
  if (context === null) {
    throw new Error(`useProjectPageContext must be used within a ProjectPageContextProvider`)
  }
  return context
}

export default ProjectPageContextProvider