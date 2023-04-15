precision mediump float;
attribute vec3 position;

uniform mat4 model, view, projection;
uniform float pointSize;
uniform vec3 cameraeye;

varying float pointDistance;

void main(void) {
  gl_Position = projection * view * model * vec4(position.xyz, 1.0);
  pointDistance = distance(cameraeye, position.xyz);
  gl_PointSize = pointSize - (pointDistance / pointSize);
}
