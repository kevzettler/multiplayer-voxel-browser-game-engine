precision mediump float;

#pragma glslify: JointAndPalette = require('./JointAndPalette.glsl');
#pragma glslify: decodeJointAndPalette = require('./decodeJointAndPalette.glsl');

attribute vec4 position;
attribute vec4 normal;
attribute vec4 color;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

uniform mat4 joints[22];
uniform mat4 animationOriginOffset;
uniform float jointPaletteSplit;

uniform mat4 lightProjection;
uniform mat4 lightView;

varying vec4 vColor;
varying vec3 vNormal;
varying vec3 aoNormal;
varying float ambientOcclusion;
varying vec3 vPosition;
varying vec3 vShadowCoord;


void main() {
  JointAndPalette jointAndPalette = decodeJointAndPalette(normal.w, jointPaletteSplit);
  int jointId = jointAndPalette.jointId;
  int paletteId = jointAndPalette.paletteId;

  //Compute ambient occlusion
  ambientOcclusion = position.w / 255.0;

  //Compute normal
  aoNormal = 128.0 - normal.xyz;
  vNormal = normal.xyz;

  vColor = color;

  vPosition = position.xyz;

  // TODO this is fucked
  // Blender space is centered around the Z origin
  // Quibicle space is offset by whatever the fuck is going on in quibicle usually edge aligned
  // model == world space == the combined transform hiearchy.
  // I belive what needs to happen here is that the blender space off set needs match the world position of the verts
  vec4 worldSpacePosition =
    model * //World space
    joints[jointId] * //Blender space
    animationOriginOffset * // Move quibicle verts into blender space
    vec4(position.xyz, 1); // Quibicle space
  //NOTE position is vec4 already from aomesh format .w is AO and needs to be 1 here
  gl_Position = projection * view * worldSpacePosition;
  vShadowCoord = (lightProjection * lightView * worldSpacePosition).xyz;
}
