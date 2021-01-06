
import React from "react";

class Texturemap extends React.Component {
  render() {
    return (
      <>
        <span
          id="switch-button-texturer"
          className="switch-canvas-button icon is-small"
          style={{
            left: "-20px"
          }}
        >
          <i className="fas fa-random has-text-light"></i>
        </span>
        <span className="popout-button icon is-small">
          <i className="fas fa-sign-out-alt"></i>
        </span>
        <div
          className="has-background-black-ter"
          style={{
            borderLeft: "1px solid black"
          }}
        >
          <canvas
            id="texture-canvas"
            style={{
              overflow: "hidden",
              display: "block"
            }}
          ></canvas>
        </div>
      </>
    );
  }
}

export default Texturemap;
