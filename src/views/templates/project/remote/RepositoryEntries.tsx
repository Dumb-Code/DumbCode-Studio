import './RepositoryEntries.css'


import React from "react";

class RepositoryEntries extends React.Component {
  render() {
    return (
      <div
        id="modal-remote-repos-entries"
        style={{
          textTransform: "none"
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
              Entries for <span className="repository-header-name">name</span>
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
            <span
              className="icon is-small add-entry ml-2 tooltip"
              data-tooltip="Add Entry"
            >
              <i className="fas fa-plus"></i>
            </span>
            <div
              className="repository-entry entry-template "
              style={{
                height: "50px"
              }}
            >
              <div className="columns ml-0 mt-0 mr-0 mb-0 is-mobile">
                <div className="column entry-name">myproject</div>
                <div className="column is-narrow remote-edit">
                  <span className="icon">
                    <i className="fas fa-edit"></i>
                  </span>
                </div>
              </div>
            </div>
            <div className="entries-container"></div>
          </div>
        </div>
      </div>
    );
  }
}

export default RepositoryEntries;
