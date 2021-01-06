import './Repositories.css';

import React from 'react';

class Repositories extends React.Component {
  render() {
    return (
      <div
        id="modal-remote-repos"
        style={{
          textTransform: "none"
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
            Remote Repositories
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
          <span
            className="icon is-small add-repository ml-2 tooltip"
            data-tooltip="Add Entry"
          >
            <i className="fas fa-plus" />
          </span>
          <div
            className="pr-5 pl-3 repository-entry repository-template"
            style={{
              height: "50px"
            }}
          >
            <div className="pt-3">
              <span className="repository-owner">O</span>/
              <span className="repository-name">R</span>
              <span
                className="repository-edit pr-3 icon"
                style={{
                  float: "right"
                }}
              >
                <i className="fas fa-edit" />
              </span>
            </div>
          </div>
          <div className="mt-2 ml-2 mr-2 repository-container"></div>
        </div>
      </div>
    );
  }
}

export default Repositories;
