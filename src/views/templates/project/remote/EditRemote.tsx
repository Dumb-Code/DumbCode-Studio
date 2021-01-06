import './EditRemote.css'


import React from "react";

class EditRemote extends React.Component {
  render() {
    return (
      <div
        id="modal-repo-edit"
        style={{
          textTransform: "none",
          width: "600px"
        }}
      >
        <div className="modal-background">
          <div
            className="modal-content box"
            style={{
              backgroundColor: "#363636",
              color: "whitesmoke !important",
              textAlign: "left"
            }}
          >
            <h3
              className="title is-3"
              style={{
                color: "whitesmoke"
              }}
            >
              Edit Remote
            </h3>
            <div
              style={{
                paddingBottom: "20px"
              }}
            >
              <button
                className="modal-close"
                aria-label="close"
                style={{
                  position: "absolute"
                }}
              ></button>
            </div>
            <div className="settings-entry entry-top">
              <form id="create-new-entry-form">
                <div className="field">
                  <div className="settings-entry-field">
                    <div className="columns is-mobile">
                      <div className="column is-narrow">Name:</div>
                      <div className="column">
                        <input
                          style={{
                            width: "100%"
                          }}
                          autoComplete="on"
                          name="dcs_project_name"
                          className="project-name"
                          type="text"
                          placeholder="myremoteprojec"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="settings-entry-field">
                    <div className="columns is-mobile">
                      <div className="column is-narrow">
                        <span>Model Path:</span>
                      </div>
                      <div className="column">
                        <input
                          style={{
                            width: "100%"
                          }}
                          autoComplete="on"
                          name="dcs_model_path"
                          className="model-path"
                          type="text"
                          placeholder="assets/path/to/the/model.dcm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="settings-entry-field">
                    <div className="columns is-mobile">
                      <div className="column is-narrow">
                        <span>Animation Folder Path:</span>
                      </div>
                      <div className="column">
                        <input
                          style={{
                            width: "100%"
                          }}
                          autoComplete="on"
                          name="dcs_animation_path"
                          className="animation-path"
                          type="text"
                          placeholder="assets/path/to/the/animation/folder"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="settings-entry-field">
                    <div className="columns is-mobile">
                      <div className="column is-narrow">
                        <span>Texture Base Folder Path:</span>
                      </div>
                      <div className="column">
                        <input
                          style={{
                            width: "100%"
                          }}
                          autoComplete="on"
                          name="dcs_texture_path"
                          className="texture-path"
                          type="text"
                          placeholder="assets/path/to/the/texture/folder"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="settings-entry-field commit-container">
                    <div className="columns is-mobile">
                      <div className="column is-narrow">Commit Message</div>
                      <div className="column">
                        <input
                          className="commit-message"
                          style={{
                            width: "100%"
                          }}
                          autoComplete="off"
                          type="text"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="settings-entry-field log-area"></div>
                </div>
                <input type="submit" />
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default EditRemote;
