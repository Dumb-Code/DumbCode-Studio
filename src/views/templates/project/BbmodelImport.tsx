export default () => {
  return (
    <div
      id="bbmodel-import"
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
            BlockBench Import
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
          <div className="settings-entryentry-top ">
            Upload textures to have them automatically rearranged
          </div>
          <div className="settings-entry">
            <div className="file">
              <label className="file-label">
                <input
                  className="file-input bbmodel-file-import"
                  type="file"
                  name="bbmodel"
                  accept="image/*"
                  multiple
                />
                <span className="file-cta">
                  <span className="file-icon">
                    <i className="fas fa-upload"></i>
                  </span>
                  <span className="file-label">Texture files...</span>
                </span>
              </label>
            </div>
          </div>
          <div className="file-name-entries"></div>
          <div>
            <div className="button continue-button">Continue</div>
          </div>
        </div>
      </div>
    </div>
  );}