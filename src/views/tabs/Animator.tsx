import CubeGrow from "../modules/animator/CubeGrow";
import Editor from "../modules/animator/Editor";
import Keyframe from "../modules/animator/Keyframe";
import Position from "../modules/animator/Position";
import Progression from "../modules/animator/Progression";
import Rotation from "../modules/animator/Rotation";
import ScrubBar from "../modules/animator/ScrubBar";
import Timeline from "../modules/animator/Timeline";
import Options from "../modules/common/Options";

export default () => {
  return (
    <section
      className="section is-mobile has-background-black-ter"
      style={{
        height: "calc(100vh - 52px)",
      }}
    >
      <div
        className="has-background-black-ter tab-draggable-area"
        style={{
          paddingLeft: "15px",
          paddingTop: "6px",
          borderBottom: "1px solid black",
          gridArea: "tab",
          overflow: "hidden"
        }}
      >
        <div
          className="has-background-black-ter"
          style={{
            whiteSpace: "nowrap",
            display: "flex",
            flexDirection: "row"
          }}
        >
          <span
            className="tab-container"
            style={{
              padding: "0px",
              display: "flex"
            }}
          >
            <span
              className="tab-add icon"
              style={{
                paddingLeft: "15px",
                paddingRight: "35px"
              }}
            >
              <i className="fas fa-plus"></i>
            </span>
          </span>
        </div>
      </div>
      <div
        className="display-div editor-part"
        editor-tab="animation"
        style={{
          width: "100%",
          gridArea: "main"
        }}
      >
        <div
          className="has-background-black-ter"
          style={{
            float: "right",
            borderLeft: "1px solid black",
            gridArea: "side-bar",
            overflowX: "hidden",
            overflowY: "auto"
          }}
        >
          <div
            style={{
              borderBottom: "1px solid black"
            }}
          >
            <div>
              <Editor />
            </div>
            <div>
              <Keyframe />
            </div>
            <div className="columns is-mobile is-gapless mb-0">
              <div>
                <Position />
              </div>
              <div>
                <CubeGrow />
              </div>
            </div>
            <div
              style={{
                paddingRight: "10px",
                marginTop: "0px"
              }}
            >
              <Rotation />
            </div>
          </div>
          <div>
            <div>
              <Progression />
            </div>
          </div>
        </div>
        <div
          className="has-background-black-ter"
          style={{
            gridArea: "playback"
          }}
        >
          <div
            style={{
              borderTop: "1px solid black"
            }}
          >
            <ScrubBar />
          </div>
        </div>
        <div
          style={{
            gridArea: "bottom"
          }}
        >
          <section
            className="is-mobile has-background-black-ter is-paddingless"
            style={{
              borderTop: "1px solid black"
            }}
          >
            <div className="keyframe-board">
              <Timeline />
            </div>
          </section>
        </div>
        <div
          className="has-background-black-ter"
          style={{
            gridArea: "options"
          }}
        >
          <Options />
        </div>
      </div>
    </section>
  );}