import regl from 'react-regl';
import { DefaultContext } from 'regl';
import vert from './shaders/billboard.vert'
import frag from './shaders/billboard.frag';
import makePrimitiveQuad from 'primitive-quad';
import { quat, mat4, vec3 } from 'gl-matrix';

const quad = makePrimitiveQuad([30, 10]);

// Primitive-quad vertices are in counter-clockwise order
// the UV origin is top-left (0 - 1 range), and the normals are negative along the Z axis.
// This means by default quads will apear upside down
// need to rotate them 180 on X axis
const offsetOut = mat4.create();

export default regl({
  vert,
  frag,
  elements: quad.cells,
  attributes:{
    position: quad.positions,
    uvs: quad.uvs
  },
  uniforms:{
    model: regl.prop('model'),

    localQuadOffset: (context: DefaultContext, props : {localQuadOffset?: mat4}) => {
      if(props.localQuadOffset) return props.localQuadOffset;

      return mat4.fromRotation(
        offsetOut,
        Math.PI,
        [1,0,0],
      );
    },

    tex: regl.prop('tex')
  },
  blend: {
    enable: true,
    func: {
      src: 'src alpha',
      dst: 'one minus src alpha'
    }
  },
  depth: {
    mask:false
  }
});
