import './ReferenceImage.css'


import React from "react";

class ReferenceImage extends React.Component {
  render() {
    return (
      <div
        id="modal-ref-img"
        style={{
          textTransform: "none"
        }}
      >
        <div className="modal-background">
          <div
            className="modal-content box"
            style={{
              color: "whitesmoke !important",
              textAlign: "left",
              width: "650px !important"
            }}
          >
            <h3
              className="title is-3"
              style={{
                color: "whitesmoke"
              }}
            >
              Reference Images
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
            <div
              className="clickable"
              style={{
                marginLeft: "3rem"
              }}
            >
              <label htmlFor="ref-img-file-input">
                <div
                  className="icon is-small tooltip"
                  data-tooltip="Upload New Image"
                >
                  <i className="fas fa-upload"></i>
                </div>
              </label>
              <input
                id="ref-img-file-input"
                className="file-input-hidden"
                type="file"
                accept="image/*"
                multiple
              />
            </div>
            <div className="columns is-mobile empty-entry">
              <div className="column is-narrow preview-window"></div>
              <div
                className="column is-narrow name-container"
                style={{
                  maxWidth: "200px",
                  overflow: "hidden"
                }}
              ></div>
              <div className="column">
                <input
                  className="translucentcy-input input is-small slider has-background-black-ter is-dark has-text-light"
                  type="range"
                  max={100}
                  defaultValue={100}
                />
              </div>
              <div className="column is-narrow">
                <div
                  className="buttons has-addons mt-1 is-narrow"
                  style={{
                    float: "left"
                  }}
                >
                  <div className="checkbox-container">
                    <label className="checkbox-label">
                      <input
                        className="refimg-is-selectable"
                        type="checkbox"
                        defaultChecked
                      />
                      <span className="checkbox-custom rectangular"></span>
                    </label>
                  </div>
                </div>
                <p
                  className="has-text-light mt-1 px-2"
                  style={{
                    float: "left",
                    fontSize: "14px",
                    paddingTop: "1px"
                  }}
                >
                  Selectable
                </p>
              </div>
              <div
                className="column is-narrow"
                style={{
                  marginRight: "20px"
                }}
              >
                <span
                  className="icon is-small delete-image tooltip"
                  data-tooltip="Delete Entry"
                >
                  <i className="fas fa-trash-alt"></i>
                </span>
              </div>
            </div>
            <div className="reference-image-list"></div>
          </div>
        </div>
      </div>
    );
  }
}

export default ReferenceImage;
