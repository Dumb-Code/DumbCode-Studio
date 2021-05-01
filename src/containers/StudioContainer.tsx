import { useState } from "react";
import Modeler from "../views/modeler/Modeler"
import Animator from "../views/animator/Animator"
import Texturer from "../views/texturer/Texturer"

type Tab = {
  name: string;
  component: () => JSX.Element;
}
const Tabs: Tab[] = [
  //{ name: "Project", component: () => <Project /> },
  { name: "Modeling", component: () => <Modeler /> },
  { name: "Texture", component: () => <Texturer /> },
  { name: "Animation", component: () => <Animator /> },
]

const App = () => {

  const [activeTab, setActiveTab] = useState(Tabs[0]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 align-middle">
      <div className="flex flex-row border-b border-gray-100">
          <div className="flex-grow">
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
          className={(selected ? "bg-gray-100 text-gray-800" : "hover:bg-gray-800 text-gray-500 border-t border-l border-r border-gray-800") + " mt-1 ml-2 hover:text-white rounded-t-xl py-1 px-2"}
          onClick={setTab}
      >
          {name}
      </button>
  )
}
