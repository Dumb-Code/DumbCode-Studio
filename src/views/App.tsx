import { useState } from "react";
import Project from "./tabs/Project";
import Texturer from "./tabs/Texturer";
import Modeler from "./tabs/Modeler"
import Animator from "./tabs/Animator"

enum Tab {
  Files, Model, Texture, Animation
}
const tabMap = {
  [Tab.Files]: () => <Project />,
  [Tab.Model]: () => <Modeler />,
  [Tab.Texture]: () => <Texturer />,
  [Tab.Animation]: () => <Animator />,  
};

export default () => {
  const [ activeTab, setActiveTab ] = useState(Tab.Files)
  return (
    <>
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
            <button
              className="navbar-item top-nav-item has-background-black-bis has-text-light navbar-is-active"
              onClick={() => { setActiveTab(Tab.Files) }}
            >
              Project
            </button>
            <button
              className="navbar-item top-nav-item has-background-black-bis has-text-light"
              onClick={() => { setActiveTab(Tab.Model) }}
            >
              Modeling
            </button>
            <button
              className="navbar-item top-nav-item has-background-black-bis has-text-light"
              onClick={() => { setActiveTab(Tab.Texture) }}
            >
              Texture
            </button>
            <button
              className="navbar-item top-nav-item has-background-black-bis has-text-light"
              onClick={() => { setActiveTab(Tab.Animation)}}
            >
              Animation
            </button>
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
        {tabMap[activeTab]()}
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
    </>
  );}