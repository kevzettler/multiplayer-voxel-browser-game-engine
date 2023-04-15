precision highp float;
uniform sampler2D tex;
uniform vec4 color;

varying float pointDistance;

void main(void) {
    vec4 texColor = texture2D(tex, gl_PointCoord);
    vec4 outputColor = texColor + color;
    gl_FragColor = vec4(texColor.rbg, texColor.a - (pointDistance / 1000.0));
}
