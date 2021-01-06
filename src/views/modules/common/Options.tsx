
import React from "react";

class Options extends React.Component {
  render() {
    return (
      <div
        className="section has-background-black-ter py-0 my-0 pl-1 has-text-light pt-1"
        style={{
          height: "4vh",
          border: "1px solid #121212",
          fontSize: "14px",
          borderRight: "none"
        }}
      >
        <div className="columns is-mobile is-gapless">
          <div className="column is-narrow texture-mode-option-area">
            <div className="dropdown is-up">
              <div className="dropdown-trigger">
                <button
                  className="button is-dark"
                  aria-haspopup="true"
                  aria-controls="dropdown-display"
                  style={{
                    height: "20px",
                    fontSize: "14px"
                  }}
                >
                  <span className="texture-mode-label">Textured</span>
                  <span className="icon is-small">
                    <i className="fas fa-angle-up" aria-hidden="true"></i>
                  </span>
                </button>
              </div>
              <div className="dropdown-menu" id="dropdown-display" role="menu">
                <div className="dropdown-content has-background-black-bis">
                  <div className="dropdown-item has-text-weight-bold has-text-grey-light">
                    <p>Display Mode</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <a
                    className="dropdown-item option-select select-texture-mode"
                    select-list-entry="textured"
                  >
                    Textured
                  </a>
                  {}
                  <a
                    className="dropdown-item option-select select-texture-mode"
                    select-list-entry="untextured"
                  >
                    White
                  </a>
                  <a
                    className="dropdown-item option-select select-texture-mode"
                    select-list-entry="outline"
                  >
                    Outline
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="column is-narrow camera-mode-option-area">
            <div className="dropdown is-up">
              <div className="dropdown-trigger">
                <button
                  className="button is-dark ml-1"
                  aria-haspopup="true"
                  aria-controls="dropdown-camera"
                  style={{
                    height: "20px",
                    fontSize: "14px"
                  }}
                >
                  <span className="camera-mode-label">Perspective</span>
                  <span className="icon is-small">
                    <i className="fas fa-angle-up" aria-hidden="true"></i>
                  </span>
                </button>
              </div>
              <div className="dropdown-menu" id="dropdown-camera" role="menu">
                <div className="dropdown-content has-background-black-bis">
                  <div className="dropdown-item has-text-weight-bold has-text-grey-light">
                    <p>Render Mode</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <a
                    className="dropdown-item option-select select-camera-mode"
                    select-list-entry="perspective"
                  >
                    <span>Perspective</span>
                    <span>
                      <span className="has-text-grey-lighter">Fov:</span>
                      <input
                        className="perspective-camera-fov"
                        style={{
                          width: "50px"
                        }}
                        type="number"
                        defaultValue={65}
                      />
                    </span>
                  </a>
                  <a
                    className="dropdown-item option-select select-camera-mode"
                    select-list-entry="orthographic"
                  >
                    Orthographic
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="column is-narrow texture-layer-option-area px-3 mx-1">
            <div className="dropdown is-up">
              <div className="dropdown-trigger">
                <button
                  className="button is-dark"
                  aria-haspopup="true"
                  aria-controls="dropdown-texture-layer"
                  style={{
                    height: "20px",
                    fontSize: "14px"
                  }}
                >
                  <span className="texture-group-label">Texture Layer</span>
                  <span className="icon is-small">
                    <i className="fas fa-angle-up" aria-hidden="true"></i>
                  </span>
                </button>
              </div>
              <div
                className="dropdown-menu"
                id="dropdown-texture-layer"
                role="menu"
              >
                <div className="dropdown-content has-background-black-bis">
                  <div className="dropdown-item has-text-weight-bold has-text-grey-light">
                    <p>Texture Layer</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <div className="texture-group-layers"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="column is-narrow toggle-grid-option-area">
            <button
              className="button is-paddingless is-dark ml-1 toggle-grid-button tooltip"
              data-tooltip="Toggle Grid"
              style={{
                height: "20px",
                fontSize: "14px",
                paddingLeft: "1rem !important",
                paddingRight: "1rem !important"
              }}
            >
              <span className="icon is-small">
                <i className="fas fa-th"></i>
              </span>
            </button>
          </div>
          <div className="column is-narrow toggle-cube-option-area">
            <button
              className="button is-paddingless is-dark ml-1 toggle-cube-button tooltip"
              data-tooltip="Toggle Cube"
              style={{
                height: "20px",
                fontSize: "14px",
                paddingLeft: "1rem !important",
                paddingRight: "1rem !important"
              }}
            >
              <span className="icon is-small">
                <i className="fas fa-cube"></i>
              </span>
            </button>
          </div>
          <div className="column is-narrow total-objects-option-area">
            <div
              className="button is-paddingless is-dark px-3 mx-1 total-cubes-display"
              style={{
                height: "20px",
                fontSize: "13px"
              }}
            >
              0 Total Objects
            </div>
          </div>
          <div className="column is-narrow cubes-lock-eye-option-area">
            <button
              className="button is-paddingless is-dark cube-lock-eye"
              style={{
                height: "20px",
                fontSize: "14px",
                paddingLeft: "1rem !important",
                paddingRight: "1rem !important",
                display: "none"
              }}
            >
              <span className="icon is-small selected-cube-visible">
                <i className="far fa-eye"></i>
              </span>
            </button>
            <button
              className="button is-paddingless is-dark cube-lock-eye"
              style={{
                height: "20px",
                fontSize: "14px",
                paddingLeft: "1rem !important",
                paddingRight: "1rem !important",
                display: "none"
              }}
            >
              <span className="icon is-small selected-cube-locked">
                <i
                  className="fa fa-lock-open"
                  style={{
                    height: "11px"
                  }}
                ></i>
              </span>
            </button>
          </div>
          <div className="column is-narrow cubes-name-option-area">
            <div
              className="button is-paddingless is-dark px-3 ml-1 cube-name-display dbl-click-container"
              style={{
                height: "20px",
                fontSize: "14px",
                display: "none"
              }}
            >
              <p className="dbl-text">
                <input className="dbl-text-edit" type="text" />
              </p>
            </div>
          </div>
          <div className="column is-narrow cubes-children-option-area">
            <div
              className="button is-paddingless is-dark px-3 mx-1 cube-children-display"
              style={{
                height: "20px",
                fontSize: "14px",
                display: "none"
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  }
}

export default Options;
