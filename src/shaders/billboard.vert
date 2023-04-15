// https://stackoverflow.com/a/30097530/93212
// https://stackoverflow.com/questions/31119653/billboarding-vertices-in-the-vertex-shader/31121743#31121743
// https://stackoverflow.com/questions/41767490/how-to-transform-vertices-in-vertex-shader-to-get-a-3d-billboard

precision mediump float;

attribute vec3 position;
attribute vec2 uvs;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;
uniform mat4 localQuadOffset;

varying vec2 uv;

void main() {
  uv = uvs;


  mat4 modelViewMat = view *  model;
  vec4 billboardPos = modelViewMat * vec4(0.0, 0.0, 0.0, 1.0);

  gl_Position = projection * (billboardPos + (localQuadOffset * vec4(position.x, position.y, 0.0, 0.0)));
}
