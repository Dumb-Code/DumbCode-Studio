import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { StudioTabs } from '../containers/StudioContainer';
import DcProject, { newProject } from '../studio/formats/project/DcProject';
import UnsafeOperations from '../studio/util/UnsafeOperations';
import { createThreeContext, ThreeJsContext } from './ThreeContext';

export type StudioContext = {

  projects: DcProject[],
  addProject: (project: DcProject) => void,
  removeProject: (project: DcProject) => void,

  hasProject: boolean
  getSelectedProject: () => DcProject
  selectProject: (project: DcProject) => void,

  activeTab: Tab,
  setActiveTab: (tab: Tab) => void

  settingsOpen: boolean,
  setSettingsOpen: (open: boolean) => void
} & ThreeJsContext
const CreatedContext = createContext<StudioContext | null>(null);
export const useStudio = () => {
  const context = useContext(CreatedContext)
  if (context == null) {
    throw new Error(`useStudio must be used within a StudioContextProvider`)
  }
  return context
}

export type Tab = {
  name: string;
  color: string;
  component: () => JSX.Element;
}

const three = createThreeContext()


export const StudioContextProvider = ({ children }: { children?: ReactNode }) => {

  const [projects, setProjects] = useState<DcProject[]>([])
  //NOT const, as we want to make sure that the selectedProject ALWAYS points to the correct project
  let [selectedProject, setSelectedProject] = useState<DcProject | null>(null)

  const [activeTab, setActiveTab] = useState<Tab>(StudioTabs[0])
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (selectedProject === null) {
      return
    }
    const project = selectedProject
    const interval = setInterval(() => project.fileChangeListener.onTick(), 1000)
    return () => clearInterval(interval)
  }, [selectedProject])

  const context: StudioContext = {
    projects,
    activeTab, setActiveTab,
    settingsOpen, setSettingsOpen,
    addProject: project => {
      setProjects(projects.concat([project]))
      context.selectProject(project)
    },
    removeProject: project => {
      three.scene.remove(project.group)

      const index = projects.indexOf(project)

      setProjects(projects.filter(p => p !== project))

      if (selectedProject === project) {
        const newIndex = index === projects.length - 1 ? projects.length - 2 : index + 1
        if (newIndex !== -1) {
          context.selectProject(projects[newIndex])
        } else {
          setSelectedProject(null)
        }
      }

    },

    hasProject: selectedProject !== null,
    // get selectedProject() { return context.getSelectedProject() },
    getSelectedProject: () => {
      if (selectedProject === null) {
        const project = newProject()
        // console.trace(project)
        context.addProject(project)
        return project
      }
      return selectedProject
    },

    selectProject: project => {
      if (project !== selectedProject) {
        if (selectedProject !== null) {
          three.scene.remove(selectedProject.group)
          three.onTopScene.remove(selectedProject.overlayGroup)
        }
        three.scene.add(project.group)
        three.onTopScene.add(project.overlayGroup)
      }

      selectedProject = project
      setSelectedProject(project)
    },

    ...three
  }

  return (
    <CreatedContext.Provider value={context}>
      {children}
    </CreatedContext.Provider>
  )
}

UnsafeOperations._unsafe_hasThreeContext = () => true
UnsafeOperations._unsafe_getThreeContext = () => three