import Project from "../views/project/Project"
import Modeler from "../views/modeler/Modeler"
import TextureMapper from "../views/texturemapper/Texturemapper"
import Texturer from "../views/texturer/Texturer"
import Animator from "../views/animator/Animator"
import Showcase from "../views/showcase/Showcase"

export const StudioTabs = [
  { name: "Project", color: "bg-purple-600 hover:bg-purple-700", component: () => <Project /> },
  { name: "Modeler", color: "bg-sky-600 hover:bg-sky-700", component: () => <Modeler /> },
  { name: "Mapper", color: "bg-teal-500 hover:bg-teal-600", component: () => <TextureMapper /> },
  { name: "Texturer", color: "bg-green-500 hover:bg-green-600", component: () => <Texturer /> },
  { name: "Animator", color: "bg-yellow-500 hover:bg-yellow-600", component: () => <Animator /> },
  { name: "Showcase", color: "bg-orange-500 hover:bg-orange-600", component: () => <Showcase /> },
] as const
