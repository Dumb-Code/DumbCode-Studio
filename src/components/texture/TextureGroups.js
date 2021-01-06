import './TextureGroups.css';

import React from 'react';

class TextureGroups extends React.Component {
  render() {
    return (
      <div
        id="modal-texture-groups"
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
            textAlign: "left"
          }}
        >
          <h3
            className="title is-3"
            style={{
              color: "whitesmoke"
            }}
          >
            Texture Groups
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
          <span
            className="icon is-small add-group ml-2 tooltip"
            data-tooltip="Add Group"
          >
            <i className="fas fa-plus" />
          </span>
          <div className="pr-5 pl-3 texture-group-entry texture-group-template">
            <div className="pt-3 texture-group-toppart">
              <div className="dbl-click-container texture-group-name">
                <p className="dbl-text" />
                <input className="dbl-text-edit" type="text" />
              </div>
            </div>
          </div>
          <div
            className="pr-5 pl-3 texture-entry texture-entry-template"
            draggable="true"
          >
            <div
              className="buttons has-addons mt-1"
              style={{
                float: "left"
              }}
            >
              <div className="checkbox-container">
                <label className="checkbox-label">
                  <input
                    className="entry-is-selectable"
                    type="checkbox"
                    defaultChecked
                  />
                  <span className="checkbox-custom rectangular" />
                </label>
              </div>
            </div>
            <p
              className="has-text-light mt-1 px-2 entry-texture-name"
              style={{
                float: "left",
                fontSize: "14px",
                paddingTop: "1px"
              }}
            >
              name.png
            </p>
          </div>
          <div
            className="columns is-mobile"
            style={{
              overflowY: "auto",
              width: "600px"
            }}
          >
            <div
              className="column is-5"
              style={{
                paddingRight: "0px"
              }}
            >
              <div className="texture-group-container" />
            </div>
            <div
              className="column"
              style={{
                paddingLeft: "0px"
              }}
            >
              <div
                className="texture-layer-container-active"
                style={{
                  overflowY: "scroll"
                }}
              />
              <div
                className="texture-layer-container-unactive"
                style={{
                  overflowY: "scroll"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TextureGroups;
