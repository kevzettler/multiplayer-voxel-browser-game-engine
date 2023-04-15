#pragma glslify: JointAndPalette = require('./JointAndPalette.glsl');

float when_eq(float x, float y) {
  return 1.0 - abs(sign(x - y));
}

float when_neq(float x, float y) {
  return abs(sign(x - y));
}

JointAndPalette decodeJointAndPalette(float normalW, float jointPaletteSplit) {
  //jointId and paletteId are both packed into normal.w uint8 255
  //Joint is before the decimal palette after joint.palette

  // joint palette split is 10 or 1,
  // 1 is for static meshes taht don't have jointdata encoded in this normalW value
  // 10 is for animated meshes that have skeletons

  float packedJointAndPalette = normalW / jointPaletteSplit;
  float x, y;
  x = floor(packedJointAndPalette);

  //wew lawd this is floating point mutilation
  //equvilent js:
  //y = Math.floor(Math.ceil(((packedJointAndPalette-x) * 100)) / 10);
  // takes the decimal from packedJointAndPalette say 25.5
  // removes the x component 25.5 - 5 = 0.5
  // mults by 100 for cleaner rounding 0.5 * 100 = 0.50
  // this is needed for traling 9999 numbs
  // rounds up with ciel
  // then divides by 10 to split again
  // and floor to the rounded up value

  //The packing joint and palette is optional...
  //Verts from Mvox models use the whole slot for palette.
  float baseReverse = 1.0;
  baseReverse += 99.0 * when_neq(jointPaletteSplit, 1.0);

  y = packedJointAndPalette; //TODO this is wrong for fatkid??
  y-=x * when_neq(jointPaletteSplit, 1.0);
  y*=baseReverse;
  y=ceil(y);
  y/=jointPaletteSplit;
  y=floor(y);

  JointAndPalette JandP;
  JandP.jointId = int(x);
  JandP.paletteId = int(y);

  return JandP;
}

#pragma glslify: export(decodeJointAndPalette)
