import { createContext, FC, useContext, useState } from "react";
import DcRemoteRepo from "../studio/formats/project/DcRemoteRepos";

type ProjectPageContextType = {
  remoteSettingsOpen: boolean,
  setRemoteSettingsOpen: (value: boolean) => void

  selectedRepo: DcRemoteRepo | null,
  setSelectedRepo: (value: DcRemoteRepo) => void
}

const Context = createContext<ProjectPageContextType>({
  remoteSettingsOpen: false,
  setRemoteSettingsOpen: () => { },
  selectedRepo: null,
  setSelectedRepo: () => { }
})

const ProjectPageContext: FC = ({ children }) => {
  const [remoteSettingsOpen, setRemoteSettingsOpen] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<DcRemoteRepo | null>(null)
  return (
    <Context.Provider value={{ remoteSettingsOpen, setRemoteSettingsOpen, selectedRepo, setSelectedRepo }}>
      {children}
    </Context.Provider>
  )
}

export const useProjectPageContext = () => useContext(Context)

export default ProjectPageContext