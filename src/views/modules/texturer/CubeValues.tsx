import React from 'react';


class CubeValues extends React.Component {
  render() {
    return (
      <>
        <span
          className="icon is-medium popout-button"
          style={{
            zIndex: 500
          }}
        >
          <i className="fas fa-sign-out-alt"></i>
        </span>
        <div className="column is-narrow pb-0 mb-0">
          <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
            <p className="heading is-size-8 has-text-grey-light">MIRROR</p>
            <div className="control is-medium input-texture-mirrored editor-require-selected is-marginless">
              <span className="button icon is-medium is-dark has-background-black-ter pt-0">
                <span className="checkbox-checked">
                  <i
                    className="far fa-check-square"
                    style={{
                      height: "20px",
                      width: "20px"
                    }}
                  ></i>
                </span>
                <span className="checkbox-unchecked">
                  <i
                    className="far fa-square"
                    style={{
                      height: "20px",
                      width: "20px"
                    }}
                  ></i>
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="column is-2 pl-0 pb-0">
          <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
            <p className="heading is-size-8 has-text-grey-light">X OFFSET</p>
            <div className="field has-addons is-marginless">
              <div className="control is-small">
                <input
                  data-axis={0}
                  className="input-texure-offset modeling-ui-changeable editor-require-selected input is-small has-background-black-ter is-dark has-text-light"
                  type="number"
                  defaultValue={0}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
        <div className="column is-2 pl-0 pb-0">
          <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
            <p className="heading is-size-8 has-text-grey-light">Y OFFSET</p>
            <div className="field has-addons is-marginless">
              <div className="control is-small">
                <input
                  data-axis={1}
                  className="input-texure-offset modeling-ui-changeable editor-require-selected input is-small has-background-black-ter is-dark has-text-light"
                  type="number"
                  defaultValue={0}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className="column is-3 pl-3 pb-0"
          style={{
            borderLeft: "1px solid black"
          }}
        >
          <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
            <p className="heading is-size-8 has-text-grey-light">width</p>
            <div className="field has-addons is-marginless">
              <div className="control is-small">
                <input
                  data-axis={1}
                  className="input-texure-map-width modeling-ui-changeable editor-require-selected input is-small has-background-black-ter is-dark has-text-light"
                  type="number"
                  defaultValue={0}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
        <div className="column is-3 pl-0 pb-0">
          <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
            <p className="heading is-size-8 has-text-grey-light">height</p>
            <div className="field has-addons is-marginless">
              <div className="control is-small">
                <input
                  data-axis={1}
                  className="input-texure-height modeling-ui-changeable editor-require-selected input is-small has-background-black-ter is-dark has-text-light"
                  type="number"
                  defaultValue={0}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default CubeValues;
