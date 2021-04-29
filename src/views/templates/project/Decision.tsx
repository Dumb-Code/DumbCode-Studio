export default () => {
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
            Remote Settings
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
                Texture/Animation choices for{" "}
                <span className="model-name-span" />
              </h5>
              <div className="settings-entry-field columns is-mobile animation-selection">
                <div className="column is-narrow">Animation:</div>
                <div className="column select is-rounded is-small">
                  <select className="animation-choice-select"></select>
                </div>
              </div>
              <div className="settings-entry-field columns is-mobile texture-selection">
                <div className="column is-narrow">Texture:</div>
                <div className="column select is-small">
                  <select className="texture-choice-select"></select>
                </div>
              </div>
              <div className="settings-entry-field columns is-mobile">
                <button className="choice-made-button">Proceed</button>
              </div>
              <div className="settings-entry-field log-area"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );}