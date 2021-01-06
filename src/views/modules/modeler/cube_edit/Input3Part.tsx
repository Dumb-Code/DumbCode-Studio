import React from 'react';


class Input3Part extends React.Component {
  render() {
    return (
      <div className="column has-text-grey-light input-top-level">
        <div
          className="notification has-background-black-ter is-marginless no-border is-paddingless"
          style={{
            paddingRight: "10px !important"
          }}
        >
          <div className="field has-addons is-marginless">
            <div className="control keep-size">
              <a
                className="button is-small is-static"
                style={{
                  backgroundColor: "hsl(348, 100%, 61%)",
                  borderColor: "hsl(348, 100%, 61%)",
                  color: "white"
                }}
              >
                X
              </a>
            </div>
            <div className="control is-small">
              <input
                data-axis={0}
                className="input-part input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
                type="number"
                defaultValue={0}
              />
            </div>
          </div>
          <div className="field has-addons is-marginless">
            <div className="control keep-size">
              <a
                className="button is-small is-static"
                style={{
                  backgroundColor: "hsl(141, 53%, 53%)",
                  borderColor: "hsl(141, 53%, 53%)",
                  color: "white"
                }}
              >
                Y
              </a>
            </div>
            <div className="control is-small">
              <input
                data-axis={1}
                className="input-part input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
                type="number"
                defaultValue={0}
                style={{
                  borderTop: "none"
                }}
              />
            </div>
          </div>
          <div className="field has-addons is-marginless">
            <div className="control keep-size">
              <a
                className="button is-small is-static"
                style={{
                  backgroundColor: "hsl(204, 86%, 53%)",
                  borderColor: "hsl(204, 86%, 53%)",
                  color: "white"
                }}
              >
                Z
              </a>
            </div>
            <div className="control is-small">
              <input
                data-axis={2}
                className="input-part input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
                type="number"
                defaultValue={0}
                style={{
                  borderTop: "none"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Input3Part;
