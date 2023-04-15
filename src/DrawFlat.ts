import regl from 'react-regl';
import flatVert from './shaders/flat.vert';
import flatFrag from './shaders/flat.frag';
import flatShadowVert from './shaders/flatShadow.vert';
import flatShaowFrag from './shaders/flatShadow.frag';

export default regl({
  vert: flatVert,
  frag: flatFrag,
  elements: regl.prop('cells'),
  attributes: {
    position: regl.prop('positions'),
  },
  uniforms: {
    color: regl.prop('color'),
    model: regl.prop('model')
  }
});

export const ShadowFlat = regl({
  vert: flatShadowVert,
  frag: `
  precision mediump float;
  varying vec3 vPosition;
  void main () {
    gl_FragColor = vec4(vec3(vPosition.z), 1.0);
  }`,
  elements: regl.prop('cells'),
  attributes: {
    position: regl.prop('positions'),
  },
  uniforms: {
    model: regl.prop('model')
  }
});

export const ShadedFlat = regl({
  vert: `
             precision mediump float;

             attribute vec3 position;
             attribute vec3 normal;

             uniform mat4 projection, view, model;
             uniform mat4 lightProjection, lightView;

             varying vec3 vPosition;
             varying vec3 vNormal;
             varying vec3 vShadowCoord;

             void main() {
               vPosition = position;
               vNormal = normal;
               vec4 worldSpacePosition = model * vec4(position, 1);
               gl_Position = projection * view * worldSpacePosition;
               vShadowCoord = (lightProjection * lightView * worldSpacePosition).xyz;
           }

  `,
  frag: flatShaowFrag,
  elements: regl.prop('cells'),
  attributes: {
    position: regl.prop('positions'),
    normal: regl.prop('normals')
  },
  uniforms: {
    color: regl.prop('color'),
    model: regl.prop('model'),
  }
});
