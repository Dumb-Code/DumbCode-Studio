import { createContext, useContext, useState, ReactNode } from 'react';
import DcProject, { newProject } from '../studio/formats/project/DcProject';
import { createThreeContext, ThreeJsContext } from './ThreeContext';

export type StudioContext = {
  projects: DcProject[],
  addProject: (project: DcProject) => void,
  removeProject: (project: DcProject) => void,

  hasProject: boolean
  getSelectedProject: () => DcProject
  selectProject: (project: DcProject) => void,
} & ThreeJsContext
const CreatedContext = createContext<StudioContext | null>(null);
export const useStudio = () => {
  const context = useContext(CreatedContext)
  if (context == null) {
    throw new Error(`useStudio must be used within a StudioContextProvider`)
  }
  return context
}

const three = createThreeContext()

export const StudioContextProvider = ({ children }: { children?: ReactNode }) => {

  const [projects, setProjects] = useState<DcProject[]>([])
  //NOT const, as we want to make sure that the selectedProject ALWAYS points to the correct project
  let [selectedProject, setSelectedProject] = useState<DcProject | null>(null)

  const context: StudioContext = {
    projects,
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
        console.trace(project)
        context.addProject(project)
        return project
      }
      return selectedProject
    },

    selectProject: project => {
      if (project !== selectedProject) {
        if (selectedProject !== null) {
          three.scene.remove(selectedProject.group)
        }
        three.scene.add(project.group)
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