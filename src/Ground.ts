import createPlane from 'primitive-plane';
import { mat4 } from 'gl-matrix';
import { Buffer } from 'buffer';
import { PNG } from "pngjs";
import GroundFrag from './shaders/Ground.frag';
import regl from 'react-regl';
import grassBuff from './assets/textures/grass.png';
const grassPNG = PNG.sync.read(Buffer.from(grassBuff));

const plane = createPlane(1000, 1000);
const planeModel = mat4.fromRotation(
  mat4.identity(mat4.create()),
  -Math.PI / 2,
  [1,0,0]
);

var grassTex = regl.texture({
  width: grassPNG.width,
  height: grassPNG.height,
  data: grassPNG.data,
  mag: 'linear',
  min: 'linear',
  wrap: ['repeat', 'repeat']
});

export const ShadowGround = regl({
    frag: `
  precision mediump float;
  varying vec3 vPosition;
  void main () {
    gl_FragColor = vec4(vec3(vPosition.z), 1.0);
  }`,

    vert: `
  precision mediump float;
  attribute vec3 position;
  uniform mat4 lightProjection, lightView, model;
  varying vec3 vPosition;
  void main() {
    vec4 p = lightProjection * lightView * model * vec4(position, 1.0);
    gl_Position = p;
    vPosition = p.xyz;
  }`,


    attributes:{
      position: plane.positions,
    },

    uniforms:{
      model: planeModel
    },

    elements: plane.cells,
  });

const Ground = regl({
  cull: {
    enable: true,
  },
  vert:`
             precision mediump float;

             attribute vec3 position;
             attribute vec3 normal;
             attribute vec2 uv;

             uniform mat4 projection, view, model;
             uniform mat4 lightProjection, lightView;

             varying vec2 vUv;
             varying vec3 vPosition;
             varying vec3 vNormal;
             varying vec3 vShadowCoord;

             void main() {
               vUv = uv;
               vPosition = position;
               vNormal = normal;
               vec4 worldSpacePosition = model * vec4(position, 1);
               gl_Position = projection * view * worldSpacePosition;
               vShadowCoord = (lightProjection * lightView * worldSpacePosition).xyz;
           }
  `,
  frag: GroundFrag,
  elements: plane.cells,
  attributes:{
    position: plane.positions,
    uv: plane.uvs,
    normal: plane.normals,
  },

  uniforms:{
    model: planeModel,
    tex: grassTex
  },
});

export default Ground;
