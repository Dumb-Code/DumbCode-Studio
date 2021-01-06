import React from 'react';

import Options from './../modules/common/Options';
import CommandInput from './../modules/modeler/CommandInput';
import CommonCommands from './../modules/modeler/CommonCommands';
import CubeEdit from './../modules/modeler/CubeEdit';
import CubeLayers from './../modules/modeler/CubeLayers';
import Gumball from './../modules/modeler/Gumball';
import ImageReferenceEdit from './../modules/modeler/ImageReferenceEdit';

type Props = {
  isActive: boolean;
}

class Modeler extends React.Component<Props> {
  render() {
    return (
      <>
        <div
          className="has-background-black-ter"
          style={{
            gridArea: "command",
            position: "relative",
            height: "100%"
          }}
        >
          <CommandInput />
        </div>
        <div
          className="has-background-black-ter"
          style={{
            gridArea: "toolbar",
            borderRight: "solid 1px black"
          }}
        >
          <CommonCommands />
        </div>
        <div
          id="panel-bottom"
          className="section has-background-black-ter is-marginless is-paddingless pt-1 object-no-imgref"
          style={{
            gridArea: "right_bottom",
            position: "relative",
            borderTop: "solid 1px black",
            borderLeft: "solid 1px black"
          }}
        >
          <CubeEdit />
        </div>
        <div
          className="display-div editor-part"
          editor-tab="modeling"
          style={{
            gridArea: "main_area"
          }}
        >
          <div
            id="panel-top"
            className="editor-part has-background-black-ter object-no-imgref"
            editor-tab="modeling"
            style={{
              gridArea: "right_top",
              position: "relative",
              borderLeft: "solid 1px black"
            }}
          >
            <CubeLayers />
          </div>
          <div
            id="plane-panel"
            className="editor-part has-background-black-ter object-imgref-only"
            editor-tab="modeling"
            style={{
              gridArea: "right_top / right_top / right_bottom / right_bottom",
              position: "relative",
              borderLeft: "solid 1px black",
              display: "none"
            }}
          >
            <ImageReferenceEdit />
          </div>
          <div
            className="has-background-black-ter"
            style={{
              gridArea: "gumball",
              height: "32px"
            }}
          >
            <Gumball />
          </div>
          <div
            className="has-background-black-ter"
            style={{
              gridArea: "options"
            }}
          >
            <Options />
          </div>
          <div id="right-divider" className="vertical-divider">
            <div
              id="controls-divider"
              className="horizontal-divider object-no-imgref"
            >
              <div id="command-divider" className="horizontal-divider">
                <div id="drag-selection-overlay" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default Modeler;
