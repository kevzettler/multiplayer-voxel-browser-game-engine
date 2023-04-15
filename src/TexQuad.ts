import regl from 'react-regl';
import { DefaultContext } from 'regl';

export default regl({
    count: 6,
    vert: `
attribute vec2 position;
attribute vec2 tex;
varying vec2 texCoords;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    texCoords = tex;
}
    `,
    frag: `
precision mediump float;
varying vec2 texCoords;
uniform sampler2D texture;
void main() {
    gl_FragColor = texture2D( texture, vec2(texCoords.s, texCoords.t) );
}
    `,
    attributes: {
      position: (context: DefaultContext) => {
        const size = (context.viewportWidth + context.viewportHeight) / 6;
        const width = context.viewportWidth;
        const height = context.viewportHeight;
        const left = width - size;
        const top = height;

        let left_x =  left / width;
        let top_y = top / height;
        let right_x = (left + size) / width;
        let bottom_y = (top - size) / height;

        left_x = 2.0 * left_x - 1.0;
        right_x = 2.0 * right_x - 1.0;

        bottom_y = 2.0 * bottom_y - 1.0;
        top_y = 2.0 * top_y - 1.0;

        return [
          left_x, top_y,
          right_x, bottom_y,
          left_x, bottom_y,
          left_x, top_y,
          right_x, top_y,
          right_x, bottom_y,
        ]
      },

      tex: [
        0,1,
        1,0,
        0,0,
        0,1,
        1,1,
        1,0
      ],
    },
    uniforms: {
      texture: regl.prop('texture'),
    },
  });
