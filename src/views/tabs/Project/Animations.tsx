export default () => {
  return (
    <>
      <div
        className="columns is-mobile animation-layer-topbar has-background-black-bis mx-0 mb-0"
        style={{
          borderTopLeftRadius: "5px",
          borderTopRightRadius: "5px"
        }}
      >
        <div className="column">
          <h1 className="title is-5 ml-3">ANIMATIONS</h1>
        </div>
        <div className="column is-narrow">
          <span
            className="new-animation-button icon is-small clickable tooltip"
            data-tooltip="Create New Animation"
          >
            <i className="fas fa-plus"></i>
          </span>
        </div>
        <div className="column is-narrow">
          <div
            className="clickable tooltip"
            data-tooltip="Upload New Animation"
          >
            <label htmlFor="animation-file-input">
              <div className="icon is-small">
                <i className="fas fa-upload"></i>
              </div>
            </label>
            <input
              id="animation-file-input"
              className="file-input-hidden"
              type="file"
              accept=".dca"
              multiple
            />
          </div>
        </div>
        <div className="column is-narrow">
          <div
            className="clickable tooltip"
            data-tooltip="Upload From Model Files"
          >
            <label htmlFor="animation-tbl-files">
              <div className="icon is-small">
                <i className="fas fa-folder"></i>
              </div>
            </label>
            <input
              id="animation-tbl-files"
              className="file-input-hidden"
              type="file"
              accept=".tbl,.dcm,.bbmodel,.json"
              multiple
            />
          </div>
        </div>
      </div>
      <div
        className="animation-list pr-4 mt-0 pt-5"
        style={{
          overflowY: "scroll",
          overflowX: "hidden",
          height: "calc(100% - 48px)"
        }}
      >
        <div className="animation-list-entry columns is-mobile empty-column ml-3">
          <span className="toggle-animation clickable">
            <span
              className="toggle-on tooltip icon is-medium"
              data-tooltip="Hide Animation"
            >
              <i
                className="fas fa-check-square has-text-info is-medium"
                style={{
                  width: "22px",
                  height: "20px",
                  marginTop: "16px"
                }}
              ></i>
            </span>
            <span
              className="toggle-off tooltip icon is-medium"
              data-tooltip="Show Animation"
            >
              <i
                className="far fa-square is-medium has-text-black-bis"
                style={{
                  width: "22px",
                  height: "20px",
                  marginTop: "16px"
                }}
              ></i>
            </span>
          </span>
          <div className="column dbl-click-container animation-name">
            <p className="dbl-text">
              <input className="dbl-text-edit" type="text" />
            </p>
          </div>
          <div className="column is-narrow">
            <span
              className="download-animation-gif icon is-small clickable tooltip "
              data-tooltip="Record As Gif"
            >
              <i className="fas fa-file-video"></i>
            </span>
          </div>
          <div className="column is-narrow">
            <span
              className="download-animation-file icon is-small clickable tooltip "
              data-tooltip="Download Animation"
            >
              <i className="fas fa-file-download"></i>
            </span>
          </div>
          <div className="column is-narrow">
            <span
              className="delete-animation-button icon is-small clickable tooltip icon-close-button"
              data-tooltip="Remove Animation"
            >
              <i className="fas fa-times-circle"></i>
            </span>
          </div>
        </div>
      </div>
    </>
  );}