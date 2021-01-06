import React from "react";

class App extends React.Component {
  render() {
    return (
      <div>
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
                <img src="/images/brand/logo.svg" width={48} height={28} />
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
              <a
                className="navbar-item top-nav-item has-background-black-bis has-text-light navbar-is-active"
                onclick="setTab(this, 0)"
              >
                Project
              </a>
              <a
                className="navbar-item top-nav-item has-background-black-bis has-text-light"
                onclick="setTab(this, 1)"
              >
                Modeling
              </a>
              <a
                className="navbar-item top-nav-item has-background-black-bis has-text-light"
                onclick="setTab(this, 2)"
              >
                Texture
              </a>
              <a
                className="navbar-item top-nav-item has-background-black-bis has-text-light"
                onclick="setTab(this, 3)"
              >
                Animation
              </a>
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
          <div
            id="files-area"
            className="tab-area editor-part"
            editor-tab="files"
            module="tabs/project.html"
          />
          <div
            id="modeling-area"
            className="tab-area editor-part"
            editor-tab="modeling"
            module="tabs/modeler.html"
          />
          <div
            id="texture-area"
            className="tab-area editor-part"
            editor-tab="texture"
            module="tabs/texturer.html"
          />
          <div
            id="animation-area"
            className="tab-area editor-part"
            editor-tab="animation"
            module="tabs/animator.html"
          />
        </div>
        <div id="editor-mouseover" />
        <div id="directional-indicators">
          <div attribute="x">X</div>
          <div className="dark" attribute="y">
            Y
          </div>
          <div attribute="z">Z</div>
        </div>
        <div id="modal-area" />
      </div>
    );
  }
}

export default App;
