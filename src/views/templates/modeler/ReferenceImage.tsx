import './ReferenceImage.css'


import React from "react";

class ReferenceImage extends React.Component {
  render() {
    return (
      <style
        dangerouslySetInnerHTML={{
          __html:
            "\n    .preview-window img {\n        max-width: 50px;\n        max-height: 50px;\n    }\n\n    .empty-entry {\n        display: none !important;\n    }\n\n    .modal-content {\n        background-color: #303030; \n    }\n\n    .modal-content.is-dragging {\n        background-color: green;\n    }\n"
        }}
      />
    );
  }
}

export default ReferenceImage;
