import 'Project.css'

import Model from '../modules/project/Model';
import Textures from '../modules/project/Textures';
import Animations from '../modules/project/Animations';
import React from "react";

class Project extends React.Component {
  render() {
    return (
      <style
        dangerouslySetInnerHTML={{
          __html:
            "\n    .project-menu-hidden {\n        display: none;\n    }\n"
        }}
      />
    );
  }
}

export default Project;
