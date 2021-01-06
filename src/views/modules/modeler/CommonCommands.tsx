import './CommonCommands.css';

import React from 'react';


class CommonCommands extends React.Component {
  render() {
    return (
      <>
        <style
          dangerouslySetInnerHTML={{
            __html:
              "\n    .light-button {\n        color: rgb(122, 122, 122);\n    }\n    .command-button {\n        border-left: none;\n        border-top: none;\n        border-bottom: none;\n        color: rgb(122, 122, 122);\n        border-right: 1px solid black;\n    }\n    .command-button:hover {\n        background-color: rgb(29, 25, 25);\n    }\n    .dropdown-command {\n        margin-left: 32px;\n        margin-top: -32px;\n        padding-left: 2px;\n    }\n\n    .tooltip-border {\n        border: 1px solid black;\n    }\n    .tooltip-text {\n        font-size: 12px;\n        margin: 0px;\n    }\n"
          }}
        />
        <div className="dropdown is-hoverable">
          <div className="dropdown-trigger">
            <button
              className="icon is-medium has-background-black-ter light-button saved-command command-button"
              data-command="snap"
              aria-haspopup="true"
              aria-controls="vertex-dropdown"
            >
              <i className="fas fa-vector-square"></i>
            </button>
          </div>
          <div
            className="dropdown-menu dropdown-command"
            id="vertex-dropdown"
            role="menu"
          >
            <div className="dropdown-content has-background-black-ter tooltip-border py-1">
              <div className="dropdown-item has-background-black-ter has-text-light tooltip-text">
                <button
                  className="icon is-medium saved-command has-background-black-ter light-button tooltip"
                  data-tooltip="Snap"
                  data-command="snap"
                >
                  <i className="fas fa-vector-square"></i>
                </button>
                <button
                  className="icon is-medium saved-command has-background-black-ter light-button tooltip"
                  data-tooltip="Snap Rotation Point"
                  data-command="snap -rp"
                >
                  <i
                    className="fas fa-vector-square"
                    style={{
                      transform: "translateX(6.75px)"
                    }}
                  >
                    <i
                      className="far fa-circle"
                      style={{
                        transform: "translateX(-6.75px) scale(0.5)"
                      }}
                    ></i>
                  </i>
                </button>
                <p>
                  <strong className="has-text-info">SNAP</strong>
                </p>
                <p>
                  Allows you to move cubes relative to source and target
                  vertices.
                </p>
                <p>
                  <strong className="has-text-info">SNAP ROTATION POINT</strong>
                </p>
                <p>
                  Allows you to move the cubes rotation point to a target
                  vertex.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="dropdown is-hoverable">
          <div className="dropdown-trigger">
            <button
              className="icon is-medium saved-command has-background-black-ter command-button"
              data-command="copypaste"
              aria-haspopup="true"
              aria-controls="mirror-dropdown"
            >
              <i className="far fa-clone"></i>
            </button>
          </div>
          <div
            className="dropdown-menu dropdown-command"
            id="mirror-dropdown"
            role="menu"
          >
            <div className="dropdown-content has-background-black-ter tooltip-border py-1">
              <div className="dropdown-item has-background-black-ter has-text-light tooltip-text">
                <p>
                  <strong className="has-text-info">COPYPASTE</strong>
                </p>
                <p>
                  Copies and pastes the selected cubes and selects the newly
                  created cubes.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="dropdown is-hoverable">
          <div className="dropdown-trigger">
            <button
              className="icon is-medium saved-command has-background-black-ter command-button"
              data-command="refimg"
              aria-haspopup="true"
              aria-controls="ref-img-dropdown"
            >
              <i className="far fa-image"></i>
            </button>
          </div>
          <div
            className="dropdown-menu dropdown-command"
            id="ref-img-dropdown"
            role="menu"
          >
            <div className="dropdown-content has-background-black-ter tooltip-border py-1">
              <div className="dropdown-item has-background-black-ter has-text-light tooltip-text">
                <p>
                  <strong className="has-text-info">REFERENCE IMAGES</strong>
                </p>
                <p>Allows you to add, delete and change reference images</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default CommonCommands;
