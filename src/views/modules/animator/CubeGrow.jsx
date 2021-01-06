
import React from "react";

class CubeGrow extends React.Component {
  render() {
    return (
      <div className="column is-narrow has-text-grey-light">
        <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
          <div
            className="columns is-mobile mv-0 pv-0"
            style={{
              height: "24px",
              width: "155px"
            }}
          >
            <div className="column">
              <p className="heading is-size-8 px-1 mt-1 has-text-grey-light">
                Cube Grow
              </p>
            </div>
          </div>
          <div className="field has-addons is-marginless input-top-level">
            <div className="control">
              <a
                className="button is-small is-static"
                style={{
                  backgroundColor: "hsl(348, 100%, 61%)",
                  borderColor: "hsl(348, 100%, 61%)",
                  color: "white"
                }}
              >
                X
              </a>
            </div>
            <div className="control is-small">
              <input
                axis={0}
                className="animation-input-cube-grow editor-require-keyframe editor-require-selection input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
                type="number"
                defaultValue={0}
                style={{
                  width: "6rem"
                }}
              />
            </div>
          </div>
          <div className="field has-addons is-marginless input-top-level">
            <div className="control">
              <a
                className="button is-small is-static"
                style={{
                  backgroundColor: "hsl(141, 53%, 53%)",
                  borderColor: "hsl(141, 53%, 53%)",
                  color: "white"
                }}
              >
                Y
              </a>
            </div>
            <div className="control is-small">
              <input
                axis={1}
                className="animation-input-cube-grow editor-require-keyframe editor-require-selection input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
                type="number"
                defaultValue={0}
                style={{
                  width: "6rem",
                  borderTop: "none"
                }}
              />
            </div>
          </div>
          <div className="field has-addons is-marginless input-top-level">
            <div className="control">
              <a
                className="button is-small is-static"
                style={{
                  backgroundColor: "hsl(204, 86%, 53%)",
                  borderColor: "hsl(204, 86%, 53%)",
                  color: "white"
                }}
              >
                Z
              </a>
            </div>
            <div className="control is-small">
              <input
                axis={2}
                className="animation-input-cube-grow editor-require-keyframe editor-require-selection input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
                type="number"
                defaultValue={0}
                style={{
                  width: "6rem",
                  borderTop: "none"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CubeGrow;
