float shadowSample(vec2 co, float z, float bias, sampler2D shadowMap) {
  float a = texture2D(shadowMap, co).z;
  float b = z;
  return step(b-bias, a);
}

#pragma glslify: export(shadowSample)
