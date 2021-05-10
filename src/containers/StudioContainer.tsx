import { useState } from "react";
import Project from "../views/project/Project"
import Modeler from "../views/modeler/Modeler"
import Animator from "../views/animator/Animator"
import Texturer from "../views/texturer/Texturer"
import { StudioContextProvider, useStudio } from "../contexts/StudioContext";
import { SVGSettings } from "../components/Icons";
import Options from "../views/options/Options";

type Tab = {
  name: string;
  titleComponent: () => JSX.Element;
  color: string;
  component: () => JSX.Element;
  extraClasses: string;
}

const Tabs: Tab[] = [
  { name: "options", titleComponent: () => <SVGSettings className="w-5 h-5 px-0.5" />, color: "bg-red-500", component: () => <Options />, extraClasses: "w-9 transform translate-y-1.5" },
  { name: "project", titleComponent: () => <p>Project</p>, color: "bg-purple-600", component: () => <Project />, extraClasses:  "w-32" },
  { name: "modeler", titleComponent: () => <p>Modeling</p>, color: "bg-lightBlue-600", component: () => <Modeler />, extraClasses:  "w-32" },
  { name: "animator", titleComponent: () => <p>Animation</p>, color: "bg-yellow-500", component: () => <Animator />, extraClasses:  "w-32" },
  { name: "texturer", titleComponent: () => <p>Textuer</p>, color: "bg-green-500", component: () => <Texturer />, extraClasses:  "w-32" },
]

const StudioContainer = () => {
  return (
    <StudioContextProvider>
      <StudioApp />
    </StudioContextProvider>
  );
};

const StudioApp = () => {
  const [activeTab, setActiveTab] = useState(Tabs[1])
  const { hasProject, getSelectedProject } = useStudio()

  const tabChanged = ((tab: Tab) => {
    if (tab !== Tabs[0] && !hasProject) {
      getSelectedProject()
    }
    setActiveTab(tab)
  })

  return (
    <div className="flex flex-col h-screen bg-black align-middle">
      <div className="flex flex-row border-b border-white">
        <div className="flex-grow pl-4">
          {Tabs.map(tab => <NavBarButton key={tab.name} tab={tab} selected={tab === activeTab} setTab={() => tabChanged(tab)} />)}
        </div>
        <div className="text-gray-200 mt-1 mr-2">
          v1.0.0
          </div>
      </div>
      <div className="flex-grow min-h-0">
        {activeTab.component()}
      </div>
    </div>
  )
}

export default StudioContainer;

export const NavBarButton = ({ selected, tab, setTab }: { selected: boolean, tab: Tab, setTab: () => void }) => {
  return (
    <button
      className={tab.extraClasses + " " + (selected ? tab.color + " text-white" : "bg-gray-900 hover:bg-gray-800 text-gray-400") + " focus:outline-none mt-0.5 hover:text-white rounded-t py-1 px-2 mr-0.5"}
      onClick={setTab}
    >
      {tab.titleComponent()}
    </button>
  )
}
