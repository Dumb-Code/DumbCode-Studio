import { SVGSettings } from "@dumbcode/shared/icons";
import { PropsWithChildren, useEffect } from "react";
import GithubAccountButton from "../components/GithubAccountButton";
import CreatePortalContext from "../contexts/CreatePortalContext";
import { OptionsContextProvider, useOptions } from "../contexts/OptionsContext";
import ProjectPageContextProvider from "../contexts/ProjectPageContext";
import PWAInstallButtonContext from "../contexts/PWAInstallButtonContext";
import { StudioContextProvider, Tab, useStudio } from "../contexts/StudioContext";
import StudioPanelsContextProvider from "../contexts/StudioPanelsContext";
import ToastContext from "../contexts/ToastContext";
import TooltipContextProvider from "../contexts/TooltipContext";
import DialogBoxes from "../dialogboxes/DialogBoxes";
import { StudioTabs } from "../studio/StudioTabs";
import { useAutoRecovery } from "../studio/autorecovery/AutoRecoveryHook";
import McpStudioBridge from "../studio/mcp/McpStudioBridge";
import { createReadableFileExtended } from "../studio/files/FileTypes";
import { createProject, newProject } from "../studio/formats/project/DcProject";
import useNoDefaultKeypresses from "../studio/util/DisableUnwantedKeyup";
import { useWhenAction } from "../studio/util/UseWhenAction";
import Options from "../views/options/Options";

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
                      <>
                        <McpStudioBridge />
                        <StudioApp />
                      </>
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

const StudioApp = () => {

  useNoDefaultKeypresses()

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
