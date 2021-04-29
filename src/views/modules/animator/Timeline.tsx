import loopMarkerLeft from './loop-marker-left.svg';
import loopMarkerRight from './loop-marker-right.svg';

export default () => {
  return (
    <>
      <div
        className="keyframe-playback-marker tooltip"
        style={{
          display: "none"
        }}
      >
        <div className="columns is-mobile layer has-text-grey-light">
          <div className="column is-narrow">
            <div className="notification has-background-black-ter layer-name">
              <p
                className="heading is-size-8"
                style={{
                  marginBottom: "3px",
                  width: "100px"
                }}
              >
                Events
              </p>
            </div>
          </div>
          <div
            className="column is-narrow has-text-grey-light"
            style={{
              width: "110px"
            }}
          ></div>
          <span className="eventpoint icon is-small tooltip empty-event-point">
            <i className="fas fa-map-marker" />
          </span>
          <div className="column">
            <div className="notification is-fullwidth has-background-black-ter event-points-board clip-full-box">
              <div
                className="board-persistent columns is-mobile keyframe-loop-conatiner"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  display: "none"
                }}
              >
                <div className="column is-narrow pr-0">
                  <div
                    className="keyframe-loop-start"
                    style={{
                      position: "absolute"
                    }}
                  >
                    <img alt="loop marker left" src={loopMarkerLeft} />
                  </div>
                </div>
                <div className="column is-narrow is-paddingless keyframe-middle">
                  <div
                    style={{
                      width: "calc(100% - 22px)",
                      height: "6px",
                      marginLeft: "11px",
                      marginTop: "13px",
                      backgroundColor: "#5964A4",
                      borderTop: "black 1px solid",
                      borderBottom: "black 1px solid"
                    }}
                  ></div>
                  <div className="column is-narrow pl-0">
                    <div
                      className="keyframe-loop-end"
                      style={{
                        position: "absolute",
                        transform: "translateX(-100%)"
                      }}
                    >
                      <img alt="loop marker right" src={loopMarkerRight} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="keyframe-board-columns"></div>
          <div className="columns is-mobile layer column-blue keyframe-layer empty-keyframe has-text-grey-light">
            <div className="column is-narrow">
              <div className="notification dbl-click-container has-background-black-ter layer-name layer-name-container">
                <p
                  className="heading is-size-8 dbl-text"
                  style={{
                    marginBottom: "3px",
                    width: "100px"
                  }}
                >
                  New Layer
                </p>
                <input className="dbl-text-edit" type="text" />
              </div>
            </div>
            <div
              className="column is-narrow has-text-grey-light keyframe-icon-box"
              style={{
                width: "110px"
              }}
            >
              <span className="icon is-small kf-layer-add">
                <i className="icon-symbol fas fa-plus"></i>
              </span>
              <span className="icon is-small kf-layer-visible">
                <i className="icon-symbol far fa-eye"></i>
              </span>
              <span className="icon is-small kf-layer-lock">
                <i className="icon-symbol fas fa-lock-open"></i>
              </span>
              <span className="icon is-small kf-layer-settings">
                <i className="icon-symbol fas fa-cog"></i>
              </span>
            </div>
            <div className="column">
              <div className="notification is-fullwidth has-background-dark keyframe-container clip-full-box"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );}