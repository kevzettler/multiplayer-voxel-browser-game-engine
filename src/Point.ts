import { mat4, vec4 } from 'gl-matrix';
import regl from 'react-regl';
import { DefaultContext } from 'regl';
import pointVert from './shaders/Point.vert';
import pointFrag from './shaders/Point.frag';

export default regl({
  vert: pointVert,
  frag: pointFrag,
  count: regl.prop('count'),
  primitive: 'points',
  attributes: {
    position: regl.prop('positions'),
  },
  uniforms:{
    pointSize: 25.0,
    model: mat4.identity(mat4.create()),
    color: (
      context: DefaultContext,
      props: {color: vec4}
    ): vec4 => {
      return props.color || [0,0,0,1];
    }
  },
  depth:{
    enable: false,
  },
});
