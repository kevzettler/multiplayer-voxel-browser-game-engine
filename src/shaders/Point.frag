precision highp float;
uniform vec4 color;

varying float pointDistance;

void main(void) {
    vec4 outputColor =  color;
    gl_FragColor = vec4(outputColor.rbg, outputColor.a - (pointDistance / 1000.0));
}
