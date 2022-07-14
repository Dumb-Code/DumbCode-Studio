import { PropsWithChildren, useEffect, useRef } from "react";
import GithubAccountButton from "../components/GithubAccountButton";
import { SVGSettings } from "../components/Icons";
import CreatePortalContext from "../contexts/CreatePortalContext";
import { OptionsContextProvider, useOptions } from "../contexts/OptionsContext";
import ProjectPageContextProvider from "../contexts/ProjectPageContext";
import PWAInstallButtonContext from "../contexts/PWAInstallButtonContext";
import { StudioContextProvider, Tab, useStudio } from "../contexts/StudioContext";
import StudioPanelsContextProvider from "../contexts/StudioPanelsContext";
import ToastContext from "../contexts/ToastContext";
import TooltipContextProvider from "../contexts/TooltipContext";
import DialogBoxes from "../dialogboxes/DialogBoxes";
import { useAutoRecovery } from "../studio/autorecovery/AutoRecoveryHook";
import { createReadableFileExtended } from "../studio/files/FileTypes";
import { createProject, newProject } from "../studio/formats/project/DcProject";
import Animator from "../views/animator/Animator";
import Modeler from "../views/modeler/Modeler";
import Options from "../views/options/Options";
import Project from "../views/project/Project";
import Showcase from "../views/showcase/Showcase";
import TextureMapper from "../views/texturemapper/Texturemapper";
import Texturer from "../views/texturer/Texturer";

//Fix an issue with FIK
if (typeof window !== "undefined") {
  //@ts-expect-error
  window['FIK'] = require('@aminere/fullik')
  window['THREE'] = require('three')
}

export const StudioTabs = [
  // { name: "options", titleComponent: () => <SVGSettings className="w-5 h-5 px-0.5" />, color: "bg-red-500", component: () => <Options />, extraClasses: "w-9 transform translate-y-1.5" },
  { name: "Project", color: "bg-purple-600 hover:bg-purple-700", component: () => <Project /> },
  { name: "Modeler", color: "bg-sky-600 hover:bg-sky-700", component: () => <Modeler /> },
  { name: "Mapper", color: "bg-teal-500 hover:bg-teal-600", component: () => <TextureMapper /> },
  { name: "Texturer", color: "bg-green-500 hover:bg-green-600", component: () => <Texturer /> },
  { name: "Animator", color: "bg-yellow-500 hover:bg-yellow-600", component: () => <Animator /> },
  { name: "Showcase", color: "bg-orange-500 hover:bg-orange-600", component: () => <Showcase /> },
] as const

const StudioContainer = () => {
  return (
    <PWAInstallButtonContext>
      <StudioContextProvider>
        <StudioPanelsContextProvider>
          <OptionsContextProvider>
            <ProjectPageContextProvider>
              <CreatePortalContext>
                <ToastContext>
                  <TooltipContextProvider>
                    <DialogBoxes>
                      <StudioApp />
                    </DialogBoxes>
                  </TooltipContextProvider>
                </ToastContext>
              </CreatePortalContext>
            </ProjectPageContextProvider>
          </OptionsContextProvider>
        </StudioPanelsContextProvider>
      </StudioContextProvider>
    </PWAInstallButtonContext>
  );
};

export const useWhenAction = (action: "create_new_model" | "last_remote_repo_project", fn: () => void) => {
  const handled = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const urlAction = new URLSearchParams(window.location.search).get("action");
    if (action === urlAction && !handled.current) {
      fn()
      handled.current = true
    }
  }, [action, fn])
}


const StudioApp = () => {


  const {
    hasProject, getSelectedProject, addProject,
    activeTab, setActiveTab,
    settingsOpen, setSettingsOpen
  } = useStudio()
  const { darkMode } = useOptions()

  useAutoRecovery()

  useWhenAction("create_new_model", () => {
    addProject(newProject())
    setActiveTab(StudioTabs[1])
  })

  useEffect(() => {
    const handler = async (e: LaunchParams) => {
      const projects = await Promise.all(
        e.files
          .filter(file => !file.name.endsWith(".dca"))
          .map(file => createProject(createReadableFileExtended(file)).then(p => { addProject(p); return p }))
      )
      //We need to load the animations to the project. We can just choose the first one, as if there are multiple
      //It's impossible to know which one to load to.
      if (projects.length === 0) {
        return
      }
      const project = projects[0]

      e.files.filter(file => file.name.endsWith(".dca"))
        .forEach(file => {
          project.loadAnimation(createReadableFileExtended(file))
        })

    }
    if (window.launchQueue !== undefined) {
      window.launchQueue.setConsumer(handler)
    }
  }, [addProject])

  const tabChanged = ((tab: Tab) => {
    //Create a project if there is none
    if (tab !== StudioTabs[0] && !hasProject) {
      getSelectedProject()
    }
    setSettingsOpen(false)
    setActiveTab(tab)
  })

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className={"flex flex-col h-screen bg-gray-300 dark:bg-black align-middle"}>
        <div className="flex flex-row border-b dark:border-white border-black">
          <div className="flex-grow pl-4">
            <NavBarButton
              color="bg-red-500"
              className="w-9 transform translate-y-1.5"
              selected={settingsOpen}
              onClick={() => setSettingsOpen(!settingsOpen)}
            >
              <SVGSettings className="w-5 h-5 px-0.5" />
            </NavBarButton>
            {StudioTabs.map(tab =>
              <NavBarButton
                key={tab.name}
                color={tab.color}
                className="w-32"
                selected={tab === activeTab && !settingsOpen}
                onClick={() => tabChanged(tab)} >
                <p>{tab.name}</p>
              </NavBarButton>
            )}
          </div>
          <div className="pt-0.5 absolute right-4">
            <GithubAccountButton />
          </div>
        </div>
        <div className={"flex-grow min-h-0"}>
          {settingsOpen ? <Options /> : activeTab.component()}
        </div>
      </div>
    </div>
  )
}

export default StudioContainer;

export const NavBarButton = ({ selected, color, onClick, className, children }: PropsWithChildren<{ selected: boolean, color: string, className: string, onClick: () => void }>) => {
  return (
    <button
      className={className + " " + (selected ? color + " text-white" : "dark:bg-gray-900 bg-gray-100 dark:hover:bg-gray-800 hover:bg-gray-100 text-black dark:text-gray-400") + " focus:outline-none mt-0.5 dark:hover:text-white rounded-t py-1 px-2 mr-0.5"}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
