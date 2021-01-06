import React from 'react';

import Animator from './tabs/Animator';
import Modeler from './tabs/Modeler';
import Project from './tabs/Project';
import Texturer from './tabs/Texturer';

type State = {
  activeTab: string;
}
type Props = {}

class App extends React.Component<Props, State> {

  state = {
    activeTab: 'project',
  }

  setTab = (activeTab: string) => {
    this.setState({ activeTab })
  }

  render() {
    const { activeTab } = this.state
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
                onClick={() => { this.setTab('project') }}
              >
                Project
              </button>
              <button
                className="navbar-item top-nav-item has-background-black-bis has-text-light"
                onClick={() => { this.setTab('modeler') }}
              >
                Modeling
              </button>
              <button
                className="navbar-item top-nav-item has-background-black-bis has-text-light"
                onClick={() => { this.setTab('texturere') }}
              >
                Texture
              </button>
              <button
                className="navbar-item top-nav-item has-background-black-bis has-text-light"
                onClick={() => { this.setTab('animator') }}
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
          <Project isActive={activeTab === 'project'} />
          <Modeler isActive={activeTab === 'modeler'} />
          <Texturer isActive={activeTab === 'texturer'} />
          <Animator isActive={activeTab === 'animator'} />
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
    );
  }
}

export default App;
