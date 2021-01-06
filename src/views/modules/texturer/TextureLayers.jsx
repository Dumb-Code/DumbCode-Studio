
import React from "react";

class TextureLayers extends React.Component {
  render() {
    return (
      <>
        <span className="icon is-medium popout-button layer-persistant">
          <i className="fas fa-sign-out-alt"></i>
        </span>
        <div className="heading ml-2 mt-2 layer-persistant has-text-grey">
          layers
        </div>
        <div
          className="texture-layer dc-c-sw columns is-mobile empty-layer layer-persistant"
          draggable="true"
        >
          <div className="dc-c-sw column is-narrow texture-layer-preview"></div>
          <div
            className="column dbl-click-container texture-layer-name-container"
            style={{
              padding: 0,
              paddingTop: "16px"
            }}
          >
            <p
              className="dbl-text"
              style={{
                whiteSpace: "nowrap",
                maxWidth: "200px",
                overflow: "hidden"
              }}
            >
              <input className="dbl-text-edit" type="text" />
            </p>
          </div>
          <div
            className="dc-c-sw column is-narrow texture-layer-visible is-activated"
            style={{
              paddingTop: "17px"
            }}
          >
            <span className="icon is-small icon-open">
              <i className="fas fa-eye"></i>
            </span>
            <span className="icon is-small icon-closed">
              <i className="fas fa-eye-slash"></i>
            </span>
          </div>
        </div>
        <div className="texture-layer new-texture-button layer-persistant">
          <span className="icon is-small">
            <i className="fas fa-plus"></i>
          </span>
          <span>New Texture</span>
        </div>
      </>
    );
  }
}

export default TextureLayers;
