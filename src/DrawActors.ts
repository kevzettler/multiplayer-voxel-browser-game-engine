import regl from 'react-regl';
import flatVert from './shaders/flat.vert';
import flatFrag from './shaders/flat.frag';

export default regl({
  vert: flatVert,
  frag: flatFrag,
  elements: regl.prop('cells'),
  attributes: {
    position: regl.prop('positions'),
  },
  uniforms: {
    color: (
      ctx: any,
      props: {color: [number,number,number,number]}
    ) => props.color || [0,1,1,0.8],
    model: regl.prop('model')
  },
  blend: {
    enable: true,
    func: {
      src: 'src color',
      dst: 'one minus constant alpha'
    },
  }
});
