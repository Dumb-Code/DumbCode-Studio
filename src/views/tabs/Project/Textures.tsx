
import React from "react";

class Textures extends React.Component {
  render() {
    return (
      <>
        <div
          className="columns is-mobile texture-layer-topbar has-background-black-bis mx-0 mb-0"
          style={{
            borderTopLeftRadius: "5px",
            borderTopRightRadius: "5px"
          }}
        >
          <div className="column">
            <h1 className="title is-5 ml-3">TEXTURE</h1>
          </div>
          <div className="column is-narrow">
            <span
              className="new-texture-button icon is-small clickable tooltip"
              data-tooltip="Create New Texture"
            >
              <i className="fas fa-plus"></i>
            </span>
          </div>
          <div className="column is-narrow">
            <div
              className="clickable tooltip"
              data-tooltip="Upload New Texture"
            >
              <label htmlFor="texture-file-input">
                <div className="icon is-small">
                  <i className="fas fa-upload"></i>
                </div>
              </label>
              <input
                id="texture-file-input"
                className="file-input-hidden"
                type="file"
                accept=".png"
                multiple
              />
            </div>
          </div>
          <div className="column is-narrow">
            <span
              className="edit-texture-groups icon is-small clickable tooltip"
              data-tooltip="Edit Texture Groups"
            >
              <i className="fas fa-layer-group"></i>
            </span>
          </div>
        </div>
        <div className="dropdown">
          <div className="dropdown-trigger">
            <button
              className="button is-dark"
              aria-haspopup="true"
              aria-controls="project-dropdown-texture-layer"
              style={{
                height: "20px"
              }}
            >
              <span className="texture-group-label">Group: </span>
              <span className="icon is-small">
                <i className="fas fa-angle-down" aria-hidden="true"></i>
              </span>
            </button>
          </div>
          <div
            className="dropdown-menu"
            id="project-dropdown-texture-layer"
            role="menu"
          >
            <div className="dropdown-content has-background-black-bis">
              {}
              <div className="texture-group-layers"></div>
            </div>
          </div>
        </div>
        <div
          className="texture-list pr-4 mt-0 pt-5 ml-4"
          style={{
            overflowY: "scroll",
            overflowX: "hidden",
            height: "calc(100% - 56px)"
          }}
        >
          <div className="texture-list-entry columns is-mobile empty-column">
            <div className="column is-narrow texture-preview"></div>
            <div className="column dbl-click-container texture-name-container">
              <p className="dbl-text">
                <input className="dbl-text-edit" type="text" />
              </p>
            </div>
            <div className="column is-narrow">
              <span
                className="download-texture-file icon is-small clickable tooltip "
                data-tooltip="Download Texture"
              >
                <i className="fas fa-file-download"></i>
              </span>
            </div>
            <div className="column is-narrow">
              <span
                className="delete-texture-button icon is-small clickable tooltip icon-close-button"
                data-tooltip="Remove Texture"
              >
                <i className="fas fa-times-circle"></i>
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default Textures;
