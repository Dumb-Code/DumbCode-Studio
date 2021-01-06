import React from 'react';

class PoppedOut extends React.Component {
  componentDidMount() {
    // eslint-disable-next-line no-undef
    document._picker = Pickr.create({
      el: '.colour-picker-container div',
      theme: 'monolith',
      showAlways: true,
      inline: true,
      useAsButton: true,
      components: {
        opacity: true,
        hue: true,
        interaction: {
          hex: true,
          input: true,
        }
      }
    })

  }
  render() {
    return (
      <div
        id="content-area"
        className="has-background-black-ter"
        style={{
          width: "100%",
          height: "100%"
        }}
      ></div>
    );
  }
}

export default PoppedOut;
