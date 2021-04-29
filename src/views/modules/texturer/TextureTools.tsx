export default () => {
  return (
    <>
      <div className="column has-background-black-ter element-picker-container">
        <div className="element-picker"></div>
        <div
          className="dc-c-sw column has-background-black-ter is-narrow"
          style={{
            borderLeft: "1px solid black",
            height: "100%"
          }}
        >
          <span className="icon is-medium popout-button">
            <i className="fas fa-sign-out-alt"></i>
          </span>
          <br />
          <span
            className="icon is-medium button-paint-mode tooltip mt-2"
            select-list-entry="pixel"
            data-tooltip="Paint Pixel"
            style={{
              borderTop: "1px solid black"
            }}
          >
            <i className="fas fa-paint-brush"></i>
          </span>
          <br />
          <span
            className="icon is-medium button-paint-mode tooltip"
            select-list-entry="face"
            data-tooltip="Paint Face"
          >
            <i className="fas fa-square"></i>
          </span>
          <br />
          <span
            className="icon is-medium button-paint-mode tooltip"
            select-list-entry="cube"
            data-tooltip="Fill Cube"
          >
            <i className="fas fa-cube"></i>
          </span>
          <br />
          <span
            className="icon is-medium button-generate-texturemap tooltip"
            data-tooltip="Generate texturemap on layer"
            style={{
              borderTop: "1px solid black"
            }}
          >
            <i className="far fa-map"></i>
          </span>
          <br />
          <br />
          <br />
          <br />
        </div>
      </div>
    </>
  );}