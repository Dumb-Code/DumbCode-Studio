
import React from "react";

class Upload extends React.Component {
  render() {
    return (
      <div
        id="modal-gif-export"
        style={{
          textTransform: "none",
          width: "600px"
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
              Sync To Github
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
            <div className="settings-entry entry-top">
              <div className="log-area"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Upload;
