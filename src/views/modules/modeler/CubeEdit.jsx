import Input3Part from 'cube_edit/Input3Part';
import Input3Part from 'cube_edit/Input3Part';
import Input3Part from 'cube_edit/Input3Part';
import Input3Part from 'cube_edit/Input3Part';
import RotationParts from 'cube_edit/RotationParts';
import React from "react";

class CubeEdit extends React.Component {
  render() {
    return (
      <>
        <span className="popout-button icon is-small">
          <i className="fas fa-sign-out-alt"></i>
        </span>
        <div className="columns is-mobile is-gapless ml-2 mb-3">
          <div className="column modeling-ui-entry">
            <p className="heading is-size-8 px-1 mt-0 has-text-grey-light">
              Dimensions
            </p>
            <div className="input-dimensions step-constant-marker has-background-black-ter is-marginless is-v-paddingless columns is-mobile is-gapless px-1">
              <Input3Part />
            </div>
          </div>
          <div className="column modeling-ui-entry">
            <p className="heading is-size-8 px-1 mt-0 has-text-grey-light">
              Position
            </p>
            <div className="input-position has-background-black-ter is-marginless is-v-paddingless columns is-mobile is-gapless px-1">
              <Input3Part />
            </div>
          </div>
        </div>
        <div className="columns is-mobile is-gapless ml-2 mt-0 mb-3">
          <div className="column modeling-ui-entry">
            <p className="heading is-size-8 px-1 mt-0 has-text-grey-light">
              Offset
            </p>
            <div className="input-offset has-background-black-ter is-marginless is-v-paddingless columns is-mobile is-gapless px-1">
              <Input3Part />
            </div>
          </div>
          <div className="column modeling-ui-entry has-background-black-ter">
            <div
              className="columns is-mobile mv-0 pv-0"
              style={{
                height: "24px",
                width: "155px"
              }}
            >
              <div className="column is-narrow">
                <p className="heading is-size-8 px-1 mt-0 has-text-grey-light">
                  Cube Grow
                </p>
              </div>
              <div className="column is-narrow has-background-black-ter has-text-grey-light cube-grow-lock is-locked">
                <span className="icon is-small lock-element">
                  <i
                    className="fas fa-lock"
                    style={{
                      width: "10px"
                    }}
                  ></i>
                </span>
                <span className="icon is-small">
                  <i
                    className="fas fa-lock-open"
                    style={{
                      width: "12px"
                    }}
                  ></i>
                </span>
              </div>
            </div>
            <div className="input-cube-grow has-background-black-ter is-marginless is-v-paddingless columns is-mobile is-gapless pl-1">
              <Input3Part />
            </div>
          </div>
        </div>
        <div className="modeling-ui-entry ml-2">
          <p className="heading is-size-8 px-1 mt-0 has-text-grey-light">
            Rotation
          </p>
          <div className="notification has-background-black-ter is-marginless no-border is-paddingless input-rotation">
            <RotationParts />
          </div>
        </div>
      </>
    );
  }
}

export default CubeEdit;
