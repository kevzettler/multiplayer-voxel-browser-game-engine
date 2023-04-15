precision mediump float;
#pragma glslify: shadowSample = require('./shadowSample.glsl');
uniform sampler2D tex;
uniform sampler2D shadowMap;
uniform vec3 lightDir;
uniform float shadowRes;
float minBias = 0.005;
float maxBias = 0.03;
float ambientLightAmount = 0.3;
float diffuseLightAmount = 0.7;
varying vec3  vNormal;
varying vec3 vShadowCoord;
varying vec2 vUv;

#define texelSize 1.0 / float(shadowRes) // 1024 Shadow res if this changes in Game3D change here

void main () {
  vec3 color = texture2D(tex,vUv * vec2(10,10)).rgb;
  vec3 ambient =  ambientLightAmount * color;
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

  gl_FragColor = vec4((ambient + diffuse * v), 1.0);
}
