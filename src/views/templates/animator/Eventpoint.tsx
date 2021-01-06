import './Eventpoint.css'


import React from "react";

class Eventpoint extends React.Component {
  render() {
    return (
      <div
        id="modal-progression"
        style={{
          textTransform: "none"
        }}
      >
        <div className="modal-background">
          <div
            className="modal-content box"
            style={{
              backgroundColor: "#363636",
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
              Event Points
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
            <div className="text-title columned">
              <span className="cl">Type</span>
              <span className="cr">Data</span>
            </div>
            <div className="event-point-entry columned empty-entry">
              <input className="cl edit-type" type="text" placeholder="Type" />
              <input className="cr edit-data" type="text" placeholder="Data" />
              <span
                className="icon is-small delete-event tooltip"
                data-tooltip="Delete Entry"
              >
                <i className="fas fa-trash-alt"></i>
              </span>
            </div>
            <div className="event-point-list">
              <span
                className="icon is-small add-event tooltip"
                data-tooltip="Add Entry"
              >
                <i className="fas fa-plus"></i>
              </span>
              <span
                className="icon is-small remove-event tooltip modal-close-button"
                data-tooltip="Remove Event"
              >
                <i className="fas fa-minus"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Eventpoint;
