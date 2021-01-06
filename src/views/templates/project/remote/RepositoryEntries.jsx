import 'RepositoryEntries.css'


import React from "react";

class RepositoryEntries extends React.Component {
  render() {
    return (
      <style
        dangerouslySetInnerHTML={{
          __html:
            "\n    .entries-container {\n        border: solid black 2px; \n        width: 500px; \n        height: 200px; \n        border-radius: 3px; \n        overflow-y: scroll;\n    }\n\n    .entry-template {\n        display: none;\n    }\n\n    .repository-entry:hover {\n        background-color: #565656;\n    }\n"
        }}
      />
    );
  }
}

export default RepositoryEntries;
