import { useState } from "react";
import Project from "../views/project/Project"
import Modeler from "../views/modeler/Modeler"
import Animator from "../views/animator/Animator"
import Texturer from "../views/texturer/Texturer"

type Tab = {
  name: string;
  component: () => JSX.Element;
}
const Tabs: Tab[] = [
  { name: "Project", component: () => <Project /> },
  { name: "Modeling", component: () => <Modeler /> },
  { name: "Texture", component: () => <Texturer /> },
  { name: "Animation", component: () => <Animator /> },
]

const App = () => {

  const [activeTab, setActiveTab] = useState(Tabs[0]);

  return (
    <div className="flex flex-col h-screen bg-black align-middle">
      <div className="flex flex-row border-b border-lightBlue-500">
          <div className="flex-grow pl-4">
              {Tabs.map(tab => <NavBarButton key={tab.name} name={tab.name} selected={tab === activeTab} setTab={() => setActiveTab(tab)} />)}
          </div>
          <div className="text-gray-200 mt-1 mr-2">
              v1.0.0
          </div>
      </div>
      <div className="flex-grow">
        {activeTab.component()}
      </div>
    </div>
  );
};

export default App;

export const NavBarButton = ({name, selected, setTab}: {name: string, selected: boolean, setTab: () => void}) => {
  return (
      <button
          className={(selected ? "bg-lightBlue-500 text-gray-800" : "bg-gray-700 hover:bg-gray-800 text-gray-300 border-t border-l border-r border-gray-800") + " focus:outline-none mt-0.5 hover:text-white rounded-t w-32 py-1 px-2"}
          onClick={setTab}
      >
          {name}
      </button>
  )
}
