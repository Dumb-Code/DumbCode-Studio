
import React from "react";

class PoppedOutColourPicker extends React.Component {
  componentDidMount() {
    
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
      <div>
        {}
        <link
          href="https://www.dumbcode.net//css/collapsible.css"
          rel="stylesheet"
        />
        <link
          href="https://www.dumbcode.net//css/cool-checkboxes.css"
          rel="stylesheet"
        />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.css"
          rel="stylesheet"
        />
        <link href="/css/tooltips.css" rel="stylesheet" />
        <link href="/css/editor.css" rel="stylesheet" />
        <link href="/css/modeler.css" rel="stylesheet" />
        <link href="/css/project.css" rel="stylesheet" />
        <link href="/css/texturer.css" rel="stylesheet" />
        <link href="/css/animator.css" rel="stylesheet" />
        <link
          href="https://fonts.googleapis.com/css?family=Montserrat:300&display=swap"
          rel="stylesheet"
        />
      </div>
    );
  }
}

export default PoppedOutColourPicker;
