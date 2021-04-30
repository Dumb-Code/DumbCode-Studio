import { useMemo, useState } from "react";
import Project from "./tabs/Project";
import Texturer from "./tabs/Texturer";
import Modeler from "./tabs/Modeler"
import Animator from "./tabs/Animator"
import { StudioContext, StudioContextProvider } from "../contexts/StudioContext";
import DcProject from "../studio/formats/DcProject";
import { createThreeContext } from "../studio/ThreeHooks";

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

export default () => {
  const [activeTab, setActiveTab] = useState(Tabs[0])

  const three = useMemo(createThreeContext, [])

  const wrap = <T,>(func: (data: T, context: StudioContext) => void) => {
    return (data: T) => {
      const cloned = { ...context }
      func(data, cloned)
      setContext(cloned)
    }
  }

  const [context, setContext] = useState<StudioContext>({
    selectedProject: null,
    setSelectedProject: wrap((data, context) => context.selectedProject = data),

    projects: [],
    setProjects: wrap((data, context) => context.projects = data),

    ...three
  })

  return (
    <StudioContextProvider value={context}>
      <section className="is-fullheight is-flex-mobile is-flex-tablet has-background-black-bis">
        <nav
          className="navbar is-desktop is-marginless heading has-text-weight-bold is-dark has-background-black-bis"
          role="navigation"
          aria-label="main navigation"
          style={{
            minHeight: "3.25rem",
            alignItems: "stretch",
            display: "flex",
            width: "100%"
          }}
        >
          <div className="navbar-brand">
            <a className="navbar-item" href="https://www.dumbcode.net/studio">
              <img alt="logo" src="/images/brand/logo.svg" width={48} height={28} />
              DUMBCODE
            </a>
            <div
              className="divider"
              style={{
                width: "2rem"
              }}
            />
          </div>
          <div
            id="navbar-menu"
            className="is-fullhd has-background-black-bis"
            style={{
              flexGrow: 1,
              flexShrink: 0,
              alignItems: "stretch",
              display: "flex"
            }}
          >
            {Tabs.map(tab => <NavBarButton key={tab.name} name={tab.name} selected={tab === activeTab} setTab={() => setActiveTab(tab)} />)}
          </div>
          <div
            className="navbar-end top-nav-item has-background-black-bis"
            style={{
              float: "right"
            }}
          >
            <div className="navbar-item top-nav-item">
              <div
                className="navbar-item top-nav-item has-text-light"
                id="dumbcode-studio-version"
              />
            </div>
          </div>
        </nav>
      </section>
      <div id="main-area" className="has-background-black-ter">
        {activeTab.component()}
      </div>
      <div id="editor-mouseover" />
      <div id="directional-indicators">
        <div data-attribute="x">X</div>
        <div className="dark" data-attribute="y">
          Y
        </div>
        <div data-attribute="z">Z</div>
      </div>
      <div id="modal-area" />
    </StudioContextProvider>
  );
}

const NavBarButton = ({name, selected, setTab}: {name: string, selected: boolean, setTab: () => void}) => {
  return (
    <button
      className={"navbar-item top-nav-item has-background-black-bis has-text-light" + selected?" navbar-is-active":""}
      onClick={setTab}
    >
      {name}
    </button>
  )
}