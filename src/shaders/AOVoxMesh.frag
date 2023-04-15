precision mediump float;
#pragma glslify: shadowSample = require('./shadowSample.glsl');
uniform sampler2D shadowMap;
uniform float shadowRes;
uniform vec3 lightDir;

float minBias = 0.005;
float maxBias = 0.03;

float diffuseLightAmount = 0.3;
float ambientLightAmount = 0.7;

varying vec3  vNormal;
varying vec3 aoNormal;
varying vec3 vShadowCoord;
varying float ambientOcclusion;

varying vec4 vColor;


#define texelSize 1.0 / float(shadowRes) // 1024 Shadow res if this changes in Game3D change here
void main() {
  vec4 color = vec4(0,0,0,1);
  float weight = 0.0;

  for(int dx=0; dx<2; ++dx) {
    for(int dy=0; dy<2; ++dy) {
      vec2 offset = 2.0 * fract(0.5 * ( vec2(dx, dy)));
      float w = pow(1.0 - max(abs(offset.x-1.0), abs(offset.y-1.0)), 16.0);

      color  += w * vColor;
      weight += w;
    }
  }

  color /= weight;

  if(color.w < 0.5) {
    discard;
  }

  float aoColor = ambientOcclusion + max(0.15*dot(aoNormal, vec3(1,1,1)), 0.0);
  float ambient = ambientLightAmount * aoColor;

  float cosTheta = dot(vNormal, lightDir);
  vec3 diffuse = diffuseLightAmount * color.rgb * clamp(cosTheta , 0.0, 1.0 );

  float v = 1.0; // shadow value
  vec2 co = vShadowCoord.xy * 0.5 + 0.5;// go from range [-1,+1] to range [0,+1]
  // counteract shadow acne.
  float bias = max(maxBias * (1.0 - cosTheta), minBias);
  float v0 = shadowSample(co + texelSize * vec2(0.0, 0.0), vShadowCoord.z, bias, shadowMap);
  float v1 = shadowSample(co + texelSize * vec2(1.0, 0.0), vShadowCoord.z, bias, shadowMap);
  float v2 = shadowSample(co + texelSize * vec2(0.0, 1.0), vShadowCoord.z, bias, shadowMap);
  float v3 = shadowSample(co + texelSize * vec2(1.0, 1.0), vShadowCoord.z, bias, shadowMap);
  // PCF filtering
  v = (v0 + v1 + v2 + v3) * (1.0 / 4.0);
  // if outside light frustum, render now shadow.
  // If WebGL had GL_CLAMP_TO_BORDER we would not have to do this,
  // but that is unfortunately not the case...
  if(co.x < 0.0 || co.x > 1.0 || co.y < 0.0 || co.y > 1.0) {
    v = 1.0;
  }


  gl_FragColor = vec4(((color.xyz * ambient) + diffuse * v), 1.0);
}
