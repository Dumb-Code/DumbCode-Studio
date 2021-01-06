import React from 'react';


class Position extends React.Component {
  render() {
    return (
      <div className="column is-narrow has-text-grey-light">
        <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
          <p className="heading is-size-8">Position</p>
          <div className="field has-addons is-marginless  input-top-level">
            <div className="control">
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
                className="animation-input-position editor-require-keyframe editor-require-selection input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
                type="number"
                defaultValue={0}
                style={{
                  width: "6rem"
                }}
              />
            </div>
          </div>
          <div className="field has-addons is-marginless  input-top-level">
            <div className="control">
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
                className="animation-input-position editor-require-keyframe editor-require-selection input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
                type="number"
                defaultValue={0}
                style={{
                  width: "6rem",
                  borderTop: "none"
                }}
              />
            </div>
          </div>
          <div className="field has-addons is-marginless  input-top-level">
            <div className="control">
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
                className="animation-input-position editor-require-keyframe editor-require-selection input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
                type="number"
                defaultValue={0}
                style={{
                  width: "6rem",
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

export default Position;
