import 'Eventpoint.css'


import React from "react";

class Eventpoint extends React.Component {
  render() {
    return (
      <style
        dangerouslySetInnerHTML={{
          __html:
            '\n    .columned {\n        display: grid;\n        grid-template: "l r";\n        grid-template-columns: 50% 50%;\n    }\n\n    .cl {\n        grid-area: l;\n    }\n\n    .cr {\n        grid-row: r;\n    }\n\n    .text-title {\n        text-align: center;\n    }\n\n    .event-point-list {\n        height: 500px;\n        overflow-y: scroll;\n    }\n\n    .event-point-entry input {\n        margin: 20px;\n        padding-top: 5px;\n        padding-bottom: 5px;\n    }\n\n    .event-point-entry {\n        border-style: solid;\n        border-color: cornsilk;\n    }\n\n    .delete-event {\n        cursor: pointer;\n    }\n\n    .empty-entry {\n        display: none;\n    }\n\n'
        }}
      />
    );
  }
}

export default Eventpoint;
