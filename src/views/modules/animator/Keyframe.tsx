export default () => {
  return (
    <>
      <div className="columns is-mobile ml-0 mt-1">
        <div className="column is-narrow pb-0">
          <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
            <p className="heading is-size-8 has-text-grey-light">Loop</p>
            <div className="field has-addons is-marginless">
              <div className="control is-small number-input">
                <div
                  className="buttons has-addons mt-1"
                  style={{
                    float: "left"
                  }}
                >
                  <div className="checkbox-container">
                    <label className="checkbox-label">
                      <input
                        className="keyframe-loop"
                        type="checkbox"
                        defaultChecked
                      />
                      <span className="checkbox-custom rectangular"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="column is-narrow pl-0 pb-0">
          <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
            <p className="heading is-size-8 has-text-grey-light">Start</p>
            <div className="field has-addons is-marginless">
              <div className="control is-small number-input">
                <input
                  className="input is-small has-background-black-ter is-dark has-text-light keyframe-loop-start editor-require-keyframe studio-scrollchange disable-upwards-looking"
                  type="number"
                  defaultValue={20}
                  style={{
                    width: "4.4rem"
                  }}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
        <div className="column is-narrow pl-0 pb-0">
          <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
            <p className="heading is-size-8 has-text-grey-light">End</p>
            <div className="field has-addons is-marginless">
              <div className="control is-small number-input">
                <input
                  className="input is-small has-background-black-ter is-dark has-text-light keyframe-loop-end editor-require-keyframe studio-scrollchange disable-upwards-looking"
                  type="number"
                  defaultValue={20}
                  style={{
                    width: "4.4rem"
                  }}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
        <div className="column is-narrow pl-0 pb-0">
          <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
            <p className="heading is-size-8 has-text-grey-light">Time</p>
            <div className="field has-addons is-marginless">
              <div className="control is-small number-input">
                <input
                  className="input is-small has-background-black-ter is-dark has-text-light keyframe-loop-time editor-require-keyframe studio-scrollchange disable-upwards-looking"
                  type="number"
                  defaultValue={20}
                  style={{
                    width: "4.4rem"
                  }}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="columns is-mobile ml-0 mt-1">
        <div className="column is-narrow pt-0">
          <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
            <p className="heading is-size-8 has-text-grey-light">
              Frame Start
            </p>
            <div className="field has-addons is-marginless">
              <div className="control is-small number-input">
                <input
                  className="input is-small has-background-black-ter is-dark has-text-light input-frame-start editor-require-keyframe studio-scrollchange disable-upwards-looking"
                  type="number"
                  defaultValue={20}
                  style={{
                    width: "8rem"
                  }}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
        <div className="column is-narrow pt-0">
          <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
            <p className="heading is-size-8 has-text-grey-light">
              Frame Length
            </p>
            <div className="field has-addons is-marginless">
              <div className="control is-small number-input">
                <input
                  className="input is-small has-background-black-ter is-dark has-text-light input-frame-length editor-require-keyframe studio-scrollchange disable-upwards-looking"
                  type="number"
                  defaultValue={20}
                  style={{
                    width: "8rem"
                  }}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {}
      <div className="columns is-mobile notification has-background-black-ter is-marginless no-border is-paddingless">
        <p className="column is-narrow heading is-size-8 has-text-grey-light pt-2">
          Inverse Kinematic Anchor
        </p>
        <div className="column field has-addons is-marginless pt-0">
          <div className="control is-small number-input">
            <div
              className="buttons has-addons mt-1"
              style={{
                float: "left"
              }}
            >
              <div className="checkbox-container">
                <label className="checkbox-label">
                  <input
                    className="keyframe-inverse-kinematics-anchor"
                    type="checkbox"
                    defaultChecked
                  />
                  <span className="checkbox-custom rectangular"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );}