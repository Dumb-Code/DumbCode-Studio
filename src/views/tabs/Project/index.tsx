import Model from "./Model"
import Textures from "./Textures"
import Animations from "./Animations"

export default () => {
  return (
    <section
      className="section is-mobile has-background-black-ter"
      style={{
        height: "calc(100vh - 52px)",
      }}
    >
      <div className="columns is-mobile">
        <div className="column is-1"></div>
        <div className="column">
          <div
            className="primary-box-area notification is-dark base-drop-area model-drop-area is-paddingless"
            style={{
              minHeight: "calc(100vh - 162px)"
            }}
          >
            <Model />
          </div>
        </div>
        <div className="column pt-0">
          <div
            className="secondary-box-area notification is-dark base-drop-area texture-drop-area required-project mt-0"
            style={{
              height: "calc(50vh - 74px)"
            }}
          >
            <Textures />
          </div>
          <div
            className="secondary-box-area notification is-dark base-drop-area animation-drop-area required-project"
            style={{
              height: "calc(50vh - 74px)"
            }}
          >
            <Animations />
          </div>
        </div>
        <div className="column is-1"></div>
      </div>
    </section >
  );}