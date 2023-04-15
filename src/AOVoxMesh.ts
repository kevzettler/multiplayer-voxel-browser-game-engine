import AOVoxMeshVert from './shaders/AOVoxMesh.vert';
import AOVoxMeshFrag from './shaders/AOVoxMesh.frag';
import ShadowVoxMeshVert from './shaders/ShadowVoxMesh.vert';
import { mat4 } from 'gl-matrix';
import regl from 'react-regl';
import { DefaultContext } from 'regl';

const aoMeshDefaultDef = {
  cull:{
    enable: true,
  },
  vert: AOVoxMeshVert,
  frag: AOVoxMeshFrag,
  count: regl.prop('count'),

  attributes:{
    position: {
      buffer: regl.prop('aomesh'),
      size: 4,
      offset: 0,
      stride: 8,
    },

    normal:{
      buffer: regl.prop('aomesh'),
      size: 4,
      offset: 4,
      stride: 8
    },

    color: regl.prop('colors'),
  },
  uniforms:{
    centerOffset: regl.prop('centerOffset'),
    model: regl.prop('model'),

    jointPaletteSplit: regl.prop('jointPaletteSplit'),

    animationOriginOffset: (
      context: DefaultContext,
      props: {animationOriginOffset?: boolean}
    ) => {
      if(props.animationOriginOffset) return props.animationOriginOffset;
      return mat4.identity(mat4.create())
    },

    //Need to unroll array uniforms
    // https://github.com/regl-project/regl/issues/258
    // https://github.com/regl-project/regl/issues/373
    //JOINTS
    ...[...new Array(22)].reduce((acc, val, index) => {
      acc[`joints[${index}]`] = regl.prop(`joints[${index}]`);
      return acc;
    }, {}),
  },
}

export const ghostBlend = regl({
  blend: {
    enable: true,
    func: {
      src: 'src color',
      dst: 'one minus constant alpha'
    },
    color: [1,1,1, 0.4]
  }
});

export const ShadowStaticAOMesh = regl({
  ...aoMeshDefaultDef,
  vert: ShadowVoxMeshVert,
  frag: `
  precision mediump float;
  varying vec3 vPosition;
  void main () {
    gl_FragColor = vec4(vec3(vPosition.z), 1.0);
  }`,
});

export default regl(aoMeshDefaultDef);
