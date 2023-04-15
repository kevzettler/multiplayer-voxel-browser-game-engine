import regl from 'react-regl';
import { mat4, vec3 } from 'gl-matrix';
export default regl({
  vert: `
attribute vec4 position;
attribute vec3 color;
uniform mat4 model, view, projection;
varying vec3 vColor;
void main(void) {
    vColor = color;
    gl_Position = projection * view * model * vec4(position.xyz, 1.0);
}
  `,
  frag: `
precision highp float;
varying vec3 vColor;
void main(void) {
    gl_FragColor = vec4(vColor.rgb, 1);
}
  `,
  primitive: 'line strip',
  count: 24,
  attributes: {
    position: [
      [0.0, 0.0, 0.0, 0],
      [1.0, 0.0, 0.0, 0],
      [0.75, 0.25, 0.0, 0],
      [0.75, -0.25, 0.0, 0],
      [1.0, 0.0, 0.0, 0],
      [0.75, 0.0, 0.25, 0],
      [0.75, 0.0, -0.25, 0],
      [1.0, 0.0, 0.0, 0],

      [0.0, 0.0, 0.0, 1],
      [0.0, 1.0, 0.0, 1],
      [0.0, 0.75, 0.25,1],
      [0.0, 0.75, -0.25,1],
      [0.0, 1.0, 0.0,1],
      [0.25, 0.75, 0.0,1],
      [-0.25, 0.75, 0.0,1],
      [0.0, 1.0, 0.0,1],

      [0.0, 0.0, 0.0,2],
      [0.0, 0.0, 1.0,2],
      [0.25, 0.0, 0.75,2],
      [-0.25, 0.0, 0.75,2],
      [0.0, 0.0, 1.0,2],
      [0.0, 0.25, 0.75,2],
      [0.0, -0.25, 0.75,2],
      [0.0, 0.0, 1.0,2],
    ],

    color: [
      [1,0,0],
      [1,0,0],
      [1,0,0],
      [1,0,0],
      [1,0,0],
      [1,0,0],
      [1,0,0],
      [1,0,0],

      [0,1,0],
      [0,1,0],
      [0,1,0],
      [0,1,0],
      [0,1,0],
      [0,1,0],
      [0,1,0],
      [0,1,0],

      [0,0,1],
      [0,0,1],
      [0,0,1],
      [0,0,1],
      [0,0,1],
      [0,0,1],
      [0,0,1],
      [0,0,1],
    ],
  },
  uniforms:{
    model: (context:any, props: {model: mat4, rotation: vec3, origin: vec3, scale: vec3}) => {
      if(props.model){
        return props.model
      }else{
        return mat4.fromRotationTranslationScaleOrigin(
          mat4.create(),
          props.rotation,
          props.origin,
          //@ts-ignore
          [props.scale, props.scale, props.scale],
          [0,0,0]
        );
      }
    },
  }
});
