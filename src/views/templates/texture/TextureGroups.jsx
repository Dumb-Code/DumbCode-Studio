import 'TextureGroups.css'


import React from "react";

class TextureGroups extends React.Component {
  render() {
    return (
      <style
        dangerouslySetInnerHTML={{
          __html:
            '\n    /* .main-area-entry {\n        border: solid black 2px; \n        height: 400px; \n        border-radius: 3px; \n    } */\n\n    .texture-group-container {\n        height: 400px;\n        border-right: black solid 1px;\n    }\n\n    .texture-layer-container-active {\n        height: 200px;\n        border-bottom: black solid 1px;\n    }\n\n    .texture-layer-container-unactive {\n        height: 200px;\n    }\n\n    .texture-group-template, .texture-entry-template {\n        display: none;\n    }\n    \n    .texture-group-entry:hover {\n        background-color: #565656;\n    }\n\n    .texture-entry:hover {\n        background-color: #664646;\n    }\n\n    .texture-group-entry.is-activated {\n        background-color: #812770;\n    }\n\n    .is-dragged {\n        background-color: #8142F2\n    }\n\n    .texture-entry {\n        overflow: hidden\n    }\n\n    .texture-entry[drag-state="top"] {\n        border-top-style: solid;\n        border-top-color: #000000;\n    }\n\n    .texture-entry[drag-state="bottom"] {\n        border-bottom-style: solid;\n        border-bottom-color: #000000;\n    }\n\n'
        }}
      />
    );
  }
}

export default TextureGroups;
