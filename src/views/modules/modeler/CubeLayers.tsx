
import React from "react";

class CubeLayers extends React.Component {
  render() {
    return (
      <>
        <span className="popout-button icon is-small">
          <i className="fas fa-sign-out-alt"></i>
        </span>
        <p className="heading is-size-8 px-1 has-text-grey-light mt-1">
          Layers
        </p>
        <div className="section is-marginless is-paddingless">
          <div className="columns is-mobile is-gapless is-marginless is-paddingless">
            <div
              className="column ml-1"
              style={{
                marginRight: "2px"
              }}
            >
              {}
              <button
                className="button is-info create-cube-sibling tooltip px-2 is-fullwidth"
                style={{
                  height: "24px"
                }}
                data-tooltip="Create a cube"
              >
                <i className="fas fa-plus has-text-light mr-1">
                  <i className="fas fa-cube has-text-light"></i>
                </i>
              </button>
            </div>
            <div
              className="column"
              style={{
                marginRight: "2px"
              }}
            >
              {}
              <button
                className="button is-info create-cube tooltip editor-require-selected px-1 is-fullwidth"
                style={{
                  height: "24px"
                }}
                data-tooltip="Create a child cube"
                disabled
              >
                <i className="fas fa-plus has-text-light mr-1">
                  <i className="fas fa-cube has-text-light">
                    <i
                      className="fas fa-cube has-text-light"
                      style={{
                        height: "10px"
                      }}
                    ></i>
                  </i>
                </i>
              </button>
            </div>
            <div
              className="column"
              style={{
                marginRight: "2px"
              }}
            >
              {}
              <button
                className="button is-info delete-cube tooltip editor-require-cubes px-3 pl-4 is-fullwidth"
                style={{
                  height: "24px"
                }}
                data-tooltip="Delete cube"
                disabled
              >
                <i
                  className="fas fa-trash has-text-light mr-1"
                  style={{
                    height: "14px"
                  }}
                ></i>
              </button>
            </div>
            <div className="column mr-1">
              {}
              <button
                className="button is-info delete-cube-and-children tooltip editor-require-children px-1 is-fullwidth"
                style={{
                  height: "24px"
                }}
                data-tooltip="Delete cube and children"
                disabled
              >
                <i
                  className="fas fa-trash has-text-light mr-1"
                  style={{
                    height: "14px"
                  }}
                >
                  <i className="fas fa-cubes has-text-light"></i>
                </i>
              </button>
            </div>
          </div>
        </div>
        {}
        <div
          className="section is-paddingless pt-3 pl-1"
          style={{
            overflowY: "scroll",
            height: "calc(100% - 48px)",
            position: "absolute",
            width: "100%"
          }}
        >
          <ul id="cube-list" className="has-text-grey-lighter "></ul>
        </div>
      </>
    );
  }
}

export default CubeLayers;
