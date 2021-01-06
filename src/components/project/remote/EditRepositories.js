import './EditRepositories.css';

import React from 'react';

class EditRepositories extends React.Component {
  render() {
    return (
      <div
        id="modal-repo-edit"
        style={{
          textTransform: "none",
          width: "600px"
        }}
      >
        <div className="modal-background" />
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
            Remote Settings
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
            />
          </div>
          <div className="settings-entry entry-top">
            <form id="github-access-form">
              <div className="field">
                <h5
                  className="title is-5"
                  style={{
                    color: "whitesmoke"
                  }}
                >
                  Remote Github Settings
                </h5>
                <div className="settings-entry-field">
                  <div className="columns is-mobile">
                    <div className="column is-narrow">
                      <a href="https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token">
                        Personal Access Token:
                      </a>
                    </div>
                    <div className="column">
                      <input
                        style={{
                          width: "100%"
                        }}
                        autoComplete="on"
                        className="access-token"
                        type="text"
                        name="dcs_github_access_token"
                        placeholder="ff34885a8624460a855540c6592698d2f1812843"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="settings-entry-field">
                  <div className="columns is-mobile">
                    <div className="column is-narrow">
                      <span>Repository:</span>
                    </div>
                    <div className="column">
                      <input
                        style={{
                          width: "30%"
                        }}
                        autoComplete="on"
                        className="repo-owner"
                        type="text"
                        name="dcs_owner"
                        placeholder="Repository Owner"
                        required
                      />
                      <span>/</span>
                      <input
                        style={{
                          width: "30%"
                        }}
                        autoComplete="on"
                        className="repo-name"
                        type="text"
                        name="dcs_repo"
                        placeholder="Repository Name"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="settings-entry-field">
                  <div className="columns is-mobile">
                    <div className="column is-narrow">
                      <span>Branch:</span>
                    </div>
                    <div className="column">
                      <input
                        style={{
                          width: "30%"
                        }}
                        autoComplete="on"
                        className="repo-branch"
                        type="text"
                        name="dcs_branch"
                        placeholder="Leave blank for default branch"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <input type="submit" />
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default EditRepositories;
