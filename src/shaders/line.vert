attribute vec3 position;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

void main(void) {
  gl_Position = projection * view * model * vec4(position, 1.0);
}
