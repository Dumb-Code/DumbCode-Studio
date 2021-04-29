export default () => {
  return (
    <div
      id="modal-gif-export"
      style={{
        textTransform: "none",
        width: "500px"
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
            Gif Settings
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
            <div className="field">
              <h5
                className="title is-5"
                style={{
                  color: "whitesmoke"
                }}
              >
                Export Settings
              </h5>
              <div className="settings-entry-field">
                <div className="control">
                  <span> Frames Per Second:</span>
                  <input
                    className="gif-fps"
                    type="number"
                    defaultValue={15}
                    step={1}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="settings-entry entry-top">
            <div className="field">
              <div className="settings-entry-field">
                <div className="control">
                  <span>Transparancy Texture:</span>
                  <input
                    type="color"
                    className="gif-transparent-texture"
                    defaultValue="#000000"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="settings-entry entry-top">
            <div className="field">
              <div className="settings-entry-field">
                <div className="control">
                  <span>Dimensions:</span>
                  <input
                    className="gif-width"
                    type="number"
                    defaultValue={500}
                    step={1}
                  />
                  <span>x</span>
                  <input
                    className="gif-height"
                    type="number"
                    defaultValue={200}
                    step={1}
                  />
                </div>
                <div>
                  <button className="gif-set-to-screen-height">
                    Set To Screen
                  </button>
                  <label>Lock Aspect Ratio:</label>
                  <div className="b-checkbox is-inline">
                    <input
                      id="checkbox-lock-aspect-ratio"
                      className="styled"
                      type="checkbox"
                    />
                    <label htmlFor="checkbox-lock-aspect-ratio"></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="settings-entry">
            <span
              className="generate-gif-button"
              style={{
                cursor: "pointer",
                backgroundColor: "red"
              }}
            >
              Generate
            </span>
            <div>
              Stage: <span className="gif-generate-stage">Not Started</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );}