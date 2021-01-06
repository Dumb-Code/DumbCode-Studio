import Input3Part from './cube_edit/Input3Part';
import RotationParts from './cube_edit/RotationParts';
import React from "react";

class ImageReferenceEdit extends React.Component {
  render() {
    return (
      <>
        <p className="heading is-size-8 px-1 has-text-grey-light mt-1 ml-2">
          Reference Image Properties
        </p>
        <div className="modeling-ui-entry ml-2 mr-0 columns is-mobile">
          <div
            className="column"
            style={{
              paddingLeft: 0,
              paddingRight: 0
            }}
          >
            <p className="heading is-size-8 px-1 mt-1 has-text-grey-light">
              Position
            </p>
            <div className="input-refimg-position has-background-black-ter is-marginless is-v-paddingless columns is-mobile is-gapless px-1">
              <Input3Part />
            </div>
          </div>
          <div
            className="column"
            style={{
              paddingLeft: 0
            }}
          >
            <p className="heading is-size-8 px-1 mt-1 has-text-grey-light">
              Scale
            </p>
            <input
              className="input-refimg-scale ml-1 input is-small has-background-black-ter is-dark has-text-light studio-scrollchange disable-upwards-looking"
              type="number"
              defaultValue={0}
            />
            <p className="heading is-size-8 px-1 mt-2 has-text-grey-light">
              Opacity
            </p>
            <input
              className="button ml-1 is-dark refimg-translucentcy-input input is-small slider has-background-black-ter is-dark has-text-light"
              type="range"
              max={100}
              defaultValue={100}
            />
          </div>
        </div>
        <div className="modeling-ui-entry ml-2">
          <p className="heading is-size-8 px-1 mt-1 has-text-grey-light">
            Rotation
          </p>
          <div className="input-refimg-rotation notification has-background-black-ter is-marginless no-border is-paddingless">
            <RotationParts />
          </div>
        </div>
        <div className="modeling-ui-entry ml-2 mr-5 mt-5">
          <p className="heading is-size-8 px-1 mt-1 has-text-grey-light">
            Texture Flip
          </p>
          <div className="columns is-mobile">
            <div className="column ">
              <div
                className="buttons has-addons mt-1"
                style={{
                  float: "left"
                }}
              >
                <div className="checkbox-container">
                  <label className="checkbox-label">
                    <input
                      className="refimg-flip-x"
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
                Flip X
              </p>
            </div>
            <div className="column">
              <div
                className="buttons has-addons mt-1"
                style={{
                  float: "left"
                }}
              >
                <div className="checkbox-container">
                  <label className="checkbox-label">
                    <input
                      className="refimg-flip-y"
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
                Flip Y
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default ImageReferenceEdit;
