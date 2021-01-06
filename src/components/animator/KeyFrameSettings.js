import React from "react";

class KeyFrameSettings extends React.Component {
  render() {
    return (
      <div
        id="modal-progression"
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
            textAlign: "left",
            width: "500px"
          }}
        >
          <h3
            className="title is-3"
            style={{
              color: "whitesmoke"
            }}
          >
            Keyframe Layer Settings
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
          <div className="settings-entry-field columns is-mobile">
            <div className="column is-narrow">Keyframe Layer Mode:</div>
            <div className="column select is-rounded is-small">
              <select className="keyframe-layer-mode-select">
                <option className="layer-mode" is-defined="false">
                  Additive
                </option>
                <option className="layer-mode" is-defined="true">
                  Defined
                </option>
              </select>
            </div>
          </div>
          <div className="settings-entry-field columns is-mobile">
            <div className="column">
              <button className="button-discard">Discard</button>
            </div>
            <div className="column">
              <button className="button-save">Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default KeyFrameSettings;
