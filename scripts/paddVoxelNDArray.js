const zeros = require('zeros');

module.exports = (ndvoxels) => {
  var resolution = ndvoxels.shape;
  var padding = resolution.map(function (r) { return r + 4; });
  var voxelsWithPadding = zeros(padding, 'int32');

  var x, y, z;

  for (x = 0; x < resolution[0]; x++) {
    for (y = 0; y < resolution[1]; y++) {
      for (z = 0; z < resolution[2]; z++) {
        // TODO - copy a row at a time for speeed
        var v = ndvoxels.get(x, y, z);
        v = v ? (1 << 15 | v) : 0;
        voxelsWithPadding.set(x + 1, y + 1, z + 1, v);
      }
    }
  }

  return voxelsWithPadding;
}