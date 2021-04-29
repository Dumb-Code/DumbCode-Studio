export default () => {
  return (
    <div className="has-text-grey-light is-paddingless ml-1 mr-2 input-top-level">
      <div className="notification has-background-black-ter is-marginless no-border is-paddingless">
        <div
          className="is-marginless"
          style={{
            display: "inline-flex",
            width: "100%"
          }}
        >
          <a
            className="button is-static is-small"
            style={{
              float: "left",
              backgroundColor: "hsl(348, 100%, 61%)",
              borderColor: "hsl(348, 100%, 61%)",
              color: "white"
            }}
          >
            X
          </a>
          <input
            data-axis={0}
            className="input-part input is-small slider has-background-black-ter is-dark has-text-light studio-scrollchange"
            type="number"
            defaultValue={0}
            style={{
              width: "4.75rem",
              float: "left"
            }}
          />
          <input
            data-axis={0}
            className="slider input-part-slider input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
            type="range"
            min={-180}
            max={180}
            defaultValue={0}
            step="0.01"
            step-mod={2}
            style={{
              float: "left",
              borderLeft: "none"
            }}
          />
        </div>
        <br />
        <div
          className="is-marginless"
          style={{
            display: "inline-flex",
            width: "100%"
          }}
        >
          <a
            className="button is-static is-small"
            style={{
              float: "left",
              backgroundColor: "hsl(141, 53%, 53%)",
              borderColor: "hsl(141, 53%, 53%)",
              color: "white"
            }}
          >
            Y
          </a>
          <input
            data-axis={1}
            className="input-part input is-small slider has-background-black-ter is-dark has-text-light studio-scrollchange"
            type="number"
            defaultValue={0}
            style={{
              width: "4.75rem",
              float: "left",
              borderTop: "none"
            }}
          />
          <input
            data-axis={1}
            className="slider input-part-slider input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
            type="range"
            min={-180}
            max={180}
            defaultValue={0}
            step="0.01"
            step-mod={2}
            style={{
              float: "left",
              borderTop: "none",
              borderLeft: "none"
            }}
          />
        </div>
        <br />
        <div
          className="is-marginless"
          style={{
            display: "inline-flex",
            width: "100%"
          }}
        >
          <a
            className="button is-static is-small"
            style={{
              float: "left",
              backgroundColor: "hsl(204, 86%, 53%)",
              borderColor: "hsl(204, 86%, 53%)",
              color: "white"
            }}
          >
            Z
          </a>
          <input
            data-axis={2}
            className="input-part input is-small slider has-background-black-ter is-dark has-text-light studio-scrollchange"
            type="number"
            defaultValue={0}
            style={{
              width: "4.75rem",
              float: "left",
              borderTop: "none"
            }}
          />
          <input
            data-axis={2}
            className="slider input-part-slider input is-small has-background-black-ter is-dark has-text-light studio-scrollchange"
            type="range"
            min={-180}
            max={180}
            defaultValue={0}
            step="0.01"
            step-mod={2}
            style={{
              float: "left",
              borderTop: "none",
              borderLeft: "none"
            }}
          />
        </div>
        <br />
        <br />
      </div>
    </div>
  );}