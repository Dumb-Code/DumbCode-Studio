
import React from "react";

class Editor extends React.Component {
  render() {
    return (
      <div className="notification has-background-black-ter no-border is-paddingless ml-3 pt-3">
        <p className="heading is-size-8 is-marginless has-text-grey-light mb-1">
          Editor
        </p>
        <div className="columns is-mobile is-gapless has-text-light">
          <div
            className="column is-narrow mr-2 button-activateable tooltip transform-control-tool"
            data-tooltip="Toggle Translate Mode"
            select-list-entry="translate"
          >
            <span className="icon is-small">
              <i className="fas fa-arrows-alt"></i>
            </span>
          </div>
          <div
            className="column is-narrow mr-2 button-activateable tooltip transform-control-tool"
            data-tooltip="Toggle Inverse Kinematic Move Mode"
            select-list-entry="translate-ik"
          >
            <span className="icon is-small">
              <i className="fas fa-exchange-alt"></i>
            </span>
          </div>
          <div
            className="column is-narrow mr-5 button-activateable tooltip transform-control-tool"
            data-tooltip="Toggle Rotate Mode"
            select-list-entry="rotate"
          >
            <span className="icon is-small">
              <i className="fas fa-circle-notch"></i>
            </span>
          </div>
          <div
            className="column is-narrow mr-5 ml-5 button-activateable tooltip transform-control-global"
            data-tooltip="Toggle Global Mode"
          >
            <span className="icon is-small">
              <i className="fas fa-globe"></i>
            </span>
          </div>
          <div
            className="column is-narrow mr-2 ml-5 button-undo tooltip"
            data-tooltip="Undo"
          >
            <span className="icon is-small">
              <i className="fas fa-undo"></i>
            </span>
          </div>
          <div
            className="column is-narrow mr-5 button-redo tooltip"
            data-tooltip="Redo"
          >
            <span className="icon is-small">
              <i className="fas fa-redo"></i>
            </span>
          </div>
          <div
            className="column is-narrow mr-2 ml-5 button-delete-keyframe tooltip"
            data-tooltip="Delete"
          >
            <span className="icon is-small">
              <i className="fas fa-trash"></i>
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export default Editor;
