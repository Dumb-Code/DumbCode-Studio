import { useState } from "react";
import Project from "../views/project/Project"
import Modeler from "../views/modeler/Modeler"
import Animator from "../views/animator/Animator"
import Texturer from "../views/texturer/Texturer"
import { StudioContextProvider } from "../contexts/StudioContext";

type Tab = {
  name: string;
  color: string;
  component: () => JSX.Element;
}
const Tabs: Tab[] = [
  { name: "Project", color: "bg-purple-600", component: () => <Project /> },
  { name: "Modeling", color: "bg-lightBlue-600", component: () => <Modeler /> },
  { name: "Animation", color: "bg-yellow-500", component: () => <Animator /> },
  { name: "Texture", color: "bg-green-500", component: () => <Texturer /> },
]

const StudioContainer = () => {

  const [activeTab, setActiveTab] = useState(Tabs[0]);

  return (
    <StudioContextProvider>
      <div className="flex flex-col h-screen bg-black align-middle">
        <div className="flex flex-row border-b border-white">
          <div className="flex-grow pl-4">
            {Tabs.map(tab => <NavBarButton key={tab.name} tab={tab} selected={tab === activeTab} setTab={() => setActiveTab(tab)} />)}
          </div>
          <div className="text-gray-200 mt-1 mr-2">
            v1.0.0
          </div>
        </div>
        <div className="flex-grow min-h-0">
          {activeTab.component()}
        </div>
      </div>
    </StudioContextProvider>
  );
};

export default StudioContainer;

export const NavBarButton = ({ selected, tab, setTab }: { selected: boolean, tab: Tab, setTab: () => void }) => {
  return (
    <button
      className={(selected ? tab.color + " text-white" : "bg-gray-900 hover:bg-gray-800 text-gray-400 border-t border-l border-r border-none") + " focus:outline-none mt-0.5 hover:text-white rounded-t w-32 py-1 px-2 mr-0.5"}
      onClick={setTab}
    >
      {tab.name}
    </button>
  )
}
