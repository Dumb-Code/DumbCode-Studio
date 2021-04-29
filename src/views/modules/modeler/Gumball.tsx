export default () => {
  return (
    <>
      <div
        className="buttons has-addons mt-1 is-narrow ml-4"
        style={{
          float: "left"
        }}
      >
        <button
          className="button is-dark option-display-type"
          select-list-entry="object"
          style={{
            height: "24px",
            fontSize: "14px"
          }}
        >
          Object
        </button>
        <button
          className="button is-dark option-display-type"
          select-list-entry="gumball"
          style={{
            height: "24px",
            fontSize: "14px"
          }}
        >
          Gumball
        </button>
      </div>
      <div
        className="section has-background-black-ter is-paddingless is-marginless is-gapless"
        style={{
          height: "3.5vh",
          borderTop: "1px solid #121212"
        }}
        id="gb-object"
      >
        <div
          className="has-addons is-narrow ml-4 object-no-object-selected"
          style={{
            float: "left",
            fontSize: "14px",
            marginTop: "6px"
          }}
        >
          No Object Selected
        </div>
        <div
          className="buttons has-addons mt-1 is-narrow ml-4 object-imgref-only"
          style={{
            float: "left",
            display: "none"
          }}
        >
          <button
            className="button is-dark ref-image-control-tool"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
            select-list-entry="translate"
          >
            Move
          </button>
          <button
            className="button is-dark ref-image-control-tool"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
            select-list-entry="rotate"
          >
            Rotate
          </button>
          <button
            className="button is-dark ref-image-control-tool"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
            select-list-entry="scale"
          >
            Scale
          </button>
        </div>
        <div
          className="buttons has-addons mt-1 is-narrow ml-4 object-imgref-only"
          style={{
            float: "left",
            display: "none"
          }}
        >
          <button
            className="button is-dark refimg-object-space-tool"
            select-list-entry="world"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
          >
            World
          </button>
          <button
            className="button is-dark refimg-object-space-tool"
            select-list-entry="local"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
          >
            Local
          </button>
        </div>
        <div
          className="buttons has-addons mt-1 is-narrow ml-4 object-need-selection object-no-imgref"
          style={{
            float: "left"
          }}
        >
          <button
            className="button is-dark transform-control-tool"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
            select-list-entry="translate"
          >
            Move
          </button>
          <button
            className="button is-dark transform-control-tool"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
            select-list-entry="rotate"
          >
            Rotate
          </button>
          <button
            className="button is-dark transform-control-tool"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
            select-list-entry="dimensions"
          >
            Dimension
          </button>
        </div>
        <div
          className="buttons has-addons mt-1 is-narrow ml-4 object-space-mode object-need-selection object-no-imgref"
          style={{
            float: "left"
          }}
        >
          <button
            className="button is-dark object-space-tool"
            select-list-entry="world"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
          >
            World
          </button>
          <button
            className="button is-dark object-space-tool"
            select-list-entry="local"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
          >
            Local
          </button>
        </div>
        <div
          className="buttons has-addons mt-1 is-narrow ml-4 object-translation-type object-need-selection  object-no-imgref"
          style={{
            float: "left"
          }}
        >
          <button
            className="button is-dark object-translate-type-entry"
            select-list-entry="position"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
          >
            Position
          </button>
          <button
            className="button is-dark object-translate-type-entry"
            select-list-entry="offset"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
          >
            Offset
          </button>
          <button
            className="button is-dark object-translate-type-entry"
            select-list-entry="rotation_point"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
          >
            Rotation Point
          </button>
        </div>
        <div
          className="buttons has-addons mt-1 is-narrow ml-4 object-rotation-type object-need-selection object-no-imgref"
          style={{
            float: "left"
          }}
        >
          <button
            className="button is-dark object-rotate-type-entry"
            select-list-entry="rotate"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
          >
            Rotate
          </button>
          <button
            className="button is-dark object-rotate-type-entry"
            select-list-entry="point"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
          >
            Rotate Around Point
          </button>
        </div>
      </div>
      <div
        className="section has-background-black-ter is-paddingless is-marginless is-gapless"
        style={{
          height: "3.5vh",
          borderTop: "1px solid #121212",
          display: "none"
        }}
        id="gb-gumball"
      >
        <div
          className="buttons has-addons mt-1 is-narrow ml-4"
          style={{
            float: "left"
          }}
        >
          <div className="checkbox-container">
            <label className="checkbox-label">
              <input
                className="gumball-automove-checkbox"
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
          Auto Move
        </p>
        <div
          className="buttons has-addons mt-1 is-narrow ml-4"
          style={{
            float: "left"
          }}
        >
          <button
            className="button is-dark gumball-reset-position-world"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
          >
            Reset Position
          </button>
          <button
            className="button is-dark gumball-reset-rotation-world"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
          >
            Reset Rotation
          </button>
        </div>
        <div
          className="buttons has-addons mt-1 is-narrow ml-4 object-need-selection"
          style={{
            float: "left"
          }}
        >
          <button
            className="button is-dark gumball-reset-position-cube"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
          >
            Cube Position
          </button>
          <button
            className="button is-dark gumball-reset-rotation-cube"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
          >
            Cube Rotation
          </button>
        </div>
        <div
          className="buttons has-addons mt-1 is-narrow ml-4"
          style={{
            float: "left"
          }}
        >
          <button
            className="button is-dark gumball-control-tool"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
            select-list-entry="translate"
          >
            Position
          </button>
          <button
            className="button is-dark gumball-control-tool"
            style={{
              height: "24px",
              fontSize: "14px"
            }}
            select-list-entry="rotate"
          >
            Rotation
          </button>
        </div>
      </div>
    </>
  );}