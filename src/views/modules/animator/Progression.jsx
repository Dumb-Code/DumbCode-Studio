
import React from "react";

class Progression extends React.Component {
  render() {
    return (
      <div className="notification is-marginless has-background-black-ter has-text-grey-light is-paddingless pt-2 ml-3 mr-3">
        <p className="heading is-size-8 has-text-grey-light">
          Progression Points
        </p>
        <div
          className="box is-dark"
          style={{
            height: "200px",
            marginTop: "10px",
            border: "none",
            padding: 0
          }}
        >
          <canvas
            width="301px"
            height="200px"
            id="progression_canvas"
            style={{
              backgroundColor: "hsl(0, 0%, 6%)"
            }}
          ></canvas>
        </div>
        <div className="container">
          <div className="columns is-mobile is-gapless is-paddingless is-marginless">
            <div
              className="column is-one-quarter"
              style={{
                marginRight: "2px"
              }}
            >
              <div className="button is-info is-small is-fullwidth easing-function-in">
                <icon className="easing-icon icon is-small">
                  <i className="far fa-check-square"></i>
                </icon>
                <span>In</span>
              </div>
            </div>
            <div
              className="column is-one-quarter"
              style={{
                marginRight: "2px"
              }}
            >
              <div className="button is-info is-small is-fullwidth easing-function-out">
                <icon className="easing-icon icon is-small">
                  <i className="far fa-check-square"></i>
                </icon>
                <span>Out</span>
              </div>
            </div>
            <div
              className="column is-half"
              style={{
                marginRight: "6px"
              }}
            >
              <div
                className="dropdown is-up"
                style={{
                  width: "100%"
                }}
              >
                <div
                  className="dropdown-trigger"
                  style={{
                    width: "100%"
                  }}
                >
                  <button
                    className="button is-small is-info is-fullwidth"
                    aria-haspopup="true"
                    aria-controls="progression-dropdown-menu"
                    style={{
                      width: "100%"
                    }}
                  >
                    <span className="dropdown-text">None</span>
                    <span
                      className="icon is-small"
                      style={{
                        position: "absolute",
                        right: "10px"
                      }}
                    >
                      <i className="fas fa-angle-up" aria-hidden="true"></i>
                    </span>
                  </button>
                </div>
                <div
                  className="dropdown-menu"
                  id="progression-dropdown-menu"
                  role="menu"
                >
                  <div className="dropdown-content has-background-dark">
                    <a
                      className="easing-function-entry dropdown-item button is-dark"
                      select-list-entry="sine"
                    >
                      Sine
                    </a>
                    <a
                      className="easing-function-entry dropdown-item button is-dark"
                      select-list-entry="quad"
                    >
                      Quad
                    </a>
                    <a
                      className="easing-function-entry dropdown-item button is-dark"
                      select-list-entry="cubic"
                    >
                      Cubic
                    </a>
                    <a
                      className="easing-function-entry dropdown-item button is-dark"
                      select-list-entry="quart"
                    >
                      Quartic
                    </a>
                    <a
                      className="easing-function-entry dropdown-item button is-dark"
                      select-list-entry="quint"
                    >
                      Quintic
                    </a>
                    <a
                      className="easing-function-entry dropdown-item button is-dark"
                      select-list-entry="expo"
                    >
                      Exponential
                    </a>
                    <a
                      className="easing-function-entry dropdown-item button is-dark"
                      select-list-entry="circ"
                    >
                      Circular
                    </a>
                    <a
                      className="easing-function-entry dropdown-item button is-dark"
                      select-list-entry="back"
                    >
                      Back
                    </a>
                    <a
                      className="easing-function-entry dropdown-item button is-dark"
                      select-list-entry="elastic"
                    >
                      Elastic
                    </a>
                    <a
                      className="easing-function-entry dropdown-item button is-dark"
                      select-list-entry="bounce"
                    >
                      Bounce
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <input
            className="easing-function-quality editor-require-keyframe input slider has-background-black-ter is-dark has-text-light tooltip mt-3"
            axis={0}
            type="range"
            min={0}
            max={40}
            defaultValue={0}
            data-tooltip="Quality: Normal"
          />
        </div>
      </div>
    );
  }
}

export default Progression;
