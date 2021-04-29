export default () => {
  return (
    <div className="field has-addons is-marginless">
      <div className="control keep-size button-restart-time">
        <a className="button is-small has-background-black-ter is-dark has-text-light animator-scrub-buttons">
          <span className="icon">
            <i className="fas fa-sync-alt"></i>
          </span>
        </a>
      </div>
      <div className="control keep-size button-reset-time">
        <a className="button is-small has-background-black-ter is-dark has-text-light animator-scrub-buttons">
          <span className="icon">
            <i className="fas fa-stop"></i>
          </span>
        </a>
      </div>
      <div className="control keep-size toggle-timeline-playstate">
        <a className="button is-small has-background-black-ter is-dark has-text-light animator-scrub-buttons">
          <span className="icon">
            <i className="play-pause-symbol fas fa-play"></i>
          </span>
        </a>
      </div>
      <div className="control keep-size toggle-timeline-looping">
        <a className="button is-small has-background-black-ter is-dark has-text-light animator-scrub-buttons">
          <span className="icon">
            <i className="fas fa-infinity"></i>
          </span>
        </a>
      </div>
      <div
        className="tooltip"
        style={{
          width: "100%"
        }}
        data-tooltip
      >
        <input
          className="input is-small slider has-background-black-ter is-dark has-text-light input-playback-range"
          type="range"
          min={0}
          defaultValue={0}
          step="0.001"
          style={{
            border: "none"
          }}
        />
      </div>
    </div>
  );}