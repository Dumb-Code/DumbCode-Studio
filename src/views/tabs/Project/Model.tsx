import React from 'react';


class Model extends React.Component {
  render() {
    return (
      <>
        <div
          className="columns is-mobile model-layer-topbar has-background-black-bis mx-0 mb-0"
          style={{
            borderTopLeftRadius: "5px",
            borderTopRightRadius: "5px"
          }}
        >
          <div className="column">
            <h1 className="title is-5 ml-3">MODEL</h1>
          </div>
          <div className="column is-narrow">
            <span
              className="new-model-button icon is-small clickable tooltip"
              data-tooltip="Create New Model"
            >
              <i className="fas fa-plus"></i>
            </span>
          </div>
          <div className="column is-narrow">
            <div className="clickable tooltip" data-tooltip="Upload New Model">
              <label htmlFor="model-file-input">
                <div className="icon is-small">
                  <i className="fas fa-upload"></i>
                </div>
              </label>
              <input
                id="model-file-input"
                className="file-input-hidden"
                type="file"
                accept=".tbl,.dcm,.bbmodel"
                multiple
              />
            </div>
          </div>
          <div className="column is-narrow">
            <div className="clickable tooltip" data-tooltip="Import as Project">
              <label htmlFor="project-file-input">
                <div className="icon is-small">
                  <i className="fas fa-file-import"></i>
                </div>
              </label>
              <input
                id="project-file-input"
                className="file-input-hidden"
                type="file"
                accept=".dcproj"
                multiple
              />
            </div>
          </div>
          <div className="column is-narrow">
            <span
              className="icon is-small clickable tooltip popup-modal-button"
              modal-target="project/remote/repositories"
              data-tooltip="Add Remote Project"
            >
              <i className="fab fa-github"></i>
            </span>
          </div>
        </div>
        <div
          className="model-list pr-4 mt-0 pt-5"
          style={{
            overflowY: "scroll",
            overflowX: "hidden",
            height: "82vh"
          }}
        >
          <div className="model-list-entry columns is-mobile empty-column">
            <div className="column is-narrow model-preview"></div>
            <div className="column dbl-click-container model-name-container">
              <p className="dbl-text">
                <input className="dbl-text-edit" type="text" />
              </p>
            </div>
            <div
              className="column is-narrow github-sync"
              style={{
                display: "none"
              }}
            >
              <span
                className="sync-project-button icon is-small clickable tooltip"
                data-tooltip="Push To Github"
              >
                <i className="fas fa-sync"></i>
              </span>
            </div>
            <div className="column is-narrow">
              <span
                className="download-project-file icon is-small clickable tooltip"
                data-tooltip="Download As Project"
              >
                <i className="fas fa-file-export"></i>
              </span>
            </div>
            <div className="column is-narrow">
              <span
                className="download-model-file icon is-small clickable tooltip "
                data-tooltip="Download Model"
              >
                <i className="fas fa-file-download"></i>
              </span>
            </div>
            <div className="column is-narrow">
              <span
                className="close-model-button icon is-small clickable tooltip icon-close-button"
                data-tooltip="Close Model"
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

export default Model;
