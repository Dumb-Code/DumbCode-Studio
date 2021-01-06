
import React from "react";

class CommandInput extends React.Component {
  render() {
    return (
      <div
        style={{
          width: "100%",
          height: "100%"
        }}
      >
        <div
          className="columns is-mobile is-gapless"
          style={{
            height: "100%"
          }}
        >
          <div className="column is-one-third">
            {}
            <div
              className="section py-0 px-0 my-0 has-text-light"
              style={{
                fontSize: "14px",
                borderBottom: "1px solid black",
                borderRight: "1px solid black",
                height: "100%"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  borderBottom: "1px solid black"
                }}
              >
                <div
                  className="icon mt-1"
                  style={{
                    position: "absolute",
                    left: "4px"
                  }}
                >
                  <i className="fas fa-arrow-right"></i>
                </div>
                <input
                  type="text"
                  className="has-background-black-ter has-text-light command-line-field"
                  style={{
                    border: "0px",
                    fontSize: "14px",
                    outline: "none",
                    width: "calc(100% - 28px)",
                    paddingLeft: "28px",
                    paddingRight: "0px"
                  }}
                />
              </div>
            </div>
          </div>
          <div className="column is-two-thirds">
            <div
              className="section py-0 my-0 command-output-lines has-text-grey-light"
              style={{
                fontSize: "14px",
                borderBottom: "1px solid black",
                position: "absolute",
                bottom: 0,
                width: "100%"
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  }
}

export default CommandInput;
