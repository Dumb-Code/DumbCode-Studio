
import React from "react";

class Rotation extends React.Component {
  render() {
    return (
      <div className="column is-narrow has-text-grey-light pt-0">
        <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
          <p className="heading is-size-8">Rotation</p>
          <div
            className="is-marginless input-top-level"
            style={{
              display: "inline-flex"
            }}
          >
            <a
              className="button is-static is-small"
              style={{
                float: "left",
                backgroundColor: "hsl(348, 100%, 61%)",
                borderColor: "hsl(348, 100%, 61%)",
                color: "white"
              }}
            >
              X
            </a>
            <input
              axis={0}
              className="animation-input-rotation editor-require-keyframe editor-require-selection input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
              type="number"
              defaultValue={0}
              style={{
                width: "6rem",
                float: "left"
              }}
            />
            <input
              axis={0}
              className="animation-input-rotation-slider editor-require-keyframe editor-require-selection input is-small slider has-background-black-ter is-dark has-text-light studio-scrollchange"
              type="range"
              min={-180}
              max={180}
              defaultValue={0}
              step="0.01"
              step-mod={2}
              style={{
                width: "11rem",
                float: "left",
                borderLeft: "none"
              }}
            />
          </div>
          <br />
          <div
            className="is-marginless input-top-level"
            style={{
              display: "inline-flex"
            }}
          >
            <a
              className="button is-static is-small"
              style={{
                float: "left",
                backgroundColor: "hsl(141, 53%, 53%)",
                borderColor: "hsl(141, 53%, 53%)",
                color: "white"
              }}
            >
              Y
            </a>
            <input
              axis={1}
              className="animation-input-rotation editor-require-keyframe editor-require-selection input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
              type="number"
              defaultValue={0}
              style={{
                width: "6rem",
                float: "left",
                borderTop: "none"
              }}
            />
            <input
              axis={1}
              className="animation-input-rotation-slider editor-require-keyframe editor-require-selection input is-small slider has-background-black-ter is-dark has-text-light studio-scrollchange"
              type="range"
              min={-180}
              max={180}
              defaultValue={0}
              step="0.01"
              step-mod={2}
              style={{
                width: "11rem",
                float: "left",
                borderTop: "none",
                borderLeft: "none"
              }}
            />
          </div>
          <br />
          <div
            className="is-marginless input-top-level"
            style={{
              display: "inline-flex"
            }}
          >
            <a
              className="button is-static is-small"
              style={{
                float: "left",
                backgroundColor: "hsl(204, 86%, 53%)",
                borderColor: "hsl(204, 86%, 53%)",
                color: "white"
              }}
            >
              Z
            </a>
            <input
              axis={2}
              className="animation-input-rotation editor-require-keyframe editor-require-selection input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
              type="number"
              defaultValue={0}
              style={{
                width: "6rem",
                float: "left",
                borderTop: "none"
              }}
            />
            <input
              axis={2}
              className="animation-input-rotation-slider editor-require-keyframe editor-require-selection input is-small slider has-background-black-ter is-dark has-text-light studio-scrollchange"
              type="range"
              min={-180}
              max={180}
              defaultValue={0}
              step="0.01"
              step-mod={2}
              style={{
                width: "11rem",
                float: "left",
                borderTop: "none",
                borderLeft: "none"
              }}
            />
          </div>
          <br />
          <br />
        </div>
      </div>
    );
  }
}

export default Rotation;
