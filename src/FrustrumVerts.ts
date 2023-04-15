import regl from 'react-regl';

export default regl({
  vert: `
attribute vec3 position;
uniform mat4 view, projection;
void main() {
  gl_Position = projection * view * vec4(position, 1);
}
  `,
  frag: `
precision mediump float;
uniform vec4 color;
void main() {
  gl_FragColor = color;
}
  `,
  elements: regl.prop('elements'),
  attributes: {
    position: regl.prop('positions'),
  },
  uniforms: {
    color: [1,0,0,1],
  },
  blend: {
    enable: true,
    func: {
      src: 'src color',
      dst: 'one minus constant alpha',
    }
  },
});
