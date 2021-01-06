import './Repositories.css'


import React from "react";

class Repositories extends React.Component {
  render() {
    return (
      <style
        dangerouslySetInnerHTML={{
          __html:
            "\n    .repository-container {\n        border: solid black 2px; \n        width: 500px; \n        height: 200px; \n        border-radius: 3px; \n        overflow-y: scroll;\n    }\n\n    .repository-template {\n        display: none;\n    }\n\n    .repository-entry:hover {\n        background-color: #565656;\n    }\n"
        }}
      />
    );
  }
}

export default Repositories;
