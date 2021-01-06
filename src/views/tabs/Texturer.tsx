import React from 'react';

import Options from './../modules/common/Options';
import CubeValues from './../modules/texturer/CubeValues';
import TextureLayers from './../modules/texturer/TextureLayers';
import Texturemap from './../modules/texturer/Texturemap';
import TextureTools from './../modules/texturer/TextureTools';

type Props = {
  isActive: boolean;
}

class Texturer extends React.Component<Props> {
  render() {
    const { isActive } = this.props
    return (
      <section
        className="section is-mobile has-background-black-ter"
        style={{
          height: "calc(100vh - 52px)",
          display: isActive ? 'block' : 'none',
        }}
      >
        <div
          id="panel-texturemap"
          className="has-background-black-ter"
          style={{
            gridArea: "texture_map",
            position: "relative"
          }}
        >
          <Texturemap />
        </div>
        <div
          id="panel-offset-editing"
          className="dc-c-sw columns is-mobile has-background-black-ter is-paddingless is-marginless"
          style={{
            gridArea: "offset_editing",
            borderTop: "1px solid black",
            borderLeft: "1px solid black",
            overflow: "hidden",
            position: "relative"
          }}
        >
          <CubeValues />
        </div>
        <div
          id="panel-colour"
          className="columns is-mobile is-gapless has-background-black-ter ml-0"
          style={{
            gridArea: "palette",
            position: "relative",
            marginLeft: "0px",
            borderLeft: "1px solid black",
            borderTop: "1px solid black",
            height: "100%"
          }}
        >
          <TextureTools />
        </div>
        <div
          className="column has-background-black-ter"
          id="panel-texture-layers"
          style={{
            gridArea: "texture_layers",
            position: "relative",
            borderLeft: "1px solid black",
            borderTop: "1px solid black",
            overflowY: "scroll",
            overflowX: "hidden",
            padding: 0
          }}
        >
          <TextureLayers />
        </div>
        <div
          className="display-div editor-part"
          editor-tab="texture"
          style={{
            gridArea: "main_area"
          }}
        >
          <div
            className="has-background-black-ter"
            style={{
              gridArea: "options"
            }}
          >
            <Options />
          </div>
          <div id="main-divider" className="vertical-divider">
            <div id="top-main-divider" className="horizontal-divider">
              <div id="texture-layers-divider" className="vertical-divider" />
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default Texturer;
