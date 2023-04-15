#pragma glslify: JointAndPalette = require('./JointAndPalette.glsl');
#pragma glslify: decodeJointAndPalette = require('./decodeJointAndPalette.glsl');

precision mediump float;

attribute vec4 position;
attribute vec4 normal;
uniform mat4 lightProjection, lightView, model;
varying vec3 vPosition;

uniform mat4 joints[22];
uniform float jointPaletteSplit;
uniform mat4 animationOriginOffset;

void main() {
  JointAndPalette jointAndPalette = decodeJointAndPalette(normal.w, jointPaletteSplit);
  int jointId = jointAndPalette.jointId;

  vec4 p = lightProjection * lightView * model * joints[jointId] * animationOriginOffset * vec4(position.xyz, 1.0);
  gl_Position = p;
  vPosition = p.xyz;
}
