import regl from 'react-regl';

// DrawCamera
export default regl({
  uniforms: {
    lightDir: regl.prop('lightDir'),
    lightView: regl.prop('lightView'),
    lightProjection: regl.prop('lightProjection'),
    view: regl.prop('view'),
    projection: regl.prop('projection'),
    shadowRes: regl.prop('shadowRes'),
    cameraeye: regl.prop('cameraeye'),
  }
})
