import React from 'react';

import Animations from './../modules/project/Animations';
import Model from './../modules/project/Model';
import Textures from './../modules/project/Textures';

type Props = {
  isActive: boolean;
}

class Project extends React.Component<Props> {
  render() {
    return (
      <section
        className="section is-mobile has-background-black-ter"
        style={{
          height: "calc(100vh - 52px)"
        }}
      >
        <div className="columns is-mobile">
          <div className="column is-1"></div>
          <div className="column">
            <div
              className="primary-box-area notification is-dark base-drop-area model-drop-area is-paddingless"
              style={{
                minHeight: "calc(100vh - 162px)"
              }}
            >
              <Model />
            </div>
          </div>
          <div className="column pt-0">
            <div
              className="secondary-box-area notification is-dark base-drop-area texture-drop-area required-project mt-0"
              style={{
                height: "calc(50vh - 74px)"
              }}
            >
              <Textures />
            </div>
            <div
              className="secondary-box-area notification is-dark base-drop-area animation-drop-area required-project"
              style={{
                height: "calc(50vh - 74px)"
              }}
            >
              <Animations />
            </div>
          </div>
          <div className="column is-1"></div>
        </div>
      </section >
    );
  }
}

export default Project;
