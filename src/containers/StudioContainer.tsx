import { FC, useState } from "react";
import Project from "../views/project/Project"
import Modeler from "../views/modeler/Modeler"
import Animator from "../views/animator/Animator"
import Texturer from "../views/texturer/Texturer"
import { StudioContextProvider, useStudio } from "../contexts/StudioContext";
import { SVGSettings } from "../components/Icons";
import Options from "../views/options/Options";
import { OptionsContextProvider, useOptions } from "../contexts/OptionsContext";

type Tab = {
  name: string;
  color: string;
  component: () => JSX.Element;
}

const Tabs: Tab[] = [
  // { name: "options", titleComponent: () => <SVGSettings className="w-5 h-5 px-0.5" />, color: "bg-red-500", component: () => <Options />, extraClasses: "w-9 transform translate-y-1.5" },
  { name: "Project", color: "bg-purple-600", component: () => <Project /> },
  { name: "Modeler", color: "bg-lightBlue-600", component: () => <Modeler /> },
  { name: "Animator", color: "bg-yellow-500", component: () => <Animator /> },
  { name: "Texturer", color: "bg-green-500", component: () => <Texturer /> },
]

const StudioContainer = () => {
  return (
    <StudioContextProvider>
      <OptionsContextProvider>
        <StudioApp />
      </OptionsContextProvider>
    </StudioContextProvider>
  );
};

const StudioApp = () => {

  const [activeTab, setActiveTab] = useState(Tabs[0])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { hasProject, getSelectedProject } = useStudio()
  const { darkMode } = useOptions()

  const tabChanged = ((tab: Tab) => {
    if (tab !== Tabs[0] && !hasProject) {
      getSelectedProject()
    }
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
            {Tabs.map(tab =>
              <NavBarButton
                key={tab.name}
                color={tab.color}
                className="w-32"
                selected={tab === activeTab}
                onClick={() => tabChanged(tab)} >
                <p>{tab.name}</p>
              </NavBarButton>
            )}
          </div>
          <div className="dark:text-gray-200 text-black mt-1 mr-2">
            v1.0.0
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

export const NavBarButton: FC<{ selected: boolean, color: string, className: string, onClick: () => void }> = ({ selected, color, onClick, className, children }) => {
  return (
    <button
      className={className + " " + (selected ? color + " text-white" : "dark:bg-gray-900 bg-gray-100 dark:hover:bg-gray-800 hover:bg-gray-100 text-black dark:text-gray-400") + " focus:outline-none mt-0.5 hover:text-black dark:hover:text-white rounded-t py-1 px-2 mr-0.5"}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
