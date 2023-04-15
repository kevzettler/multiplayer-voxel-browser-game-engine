var ndarray = require("ndarray");
var createAOMesh = require("ao-mesher");
var parseMagicaVoxel = require('parse-magica-voxel');
var paddVoxelNDArray = require('./paddVoxelNDArray.js');
var fs = require('fs');

var argv = require('minimist')(process.argv.slice(2));

const filepath = argv._[0];

const pathChunks = filepath.split('/')
const fileName = pathChunks[pathChunks.length-1].split('.')[0];

const outputDir = './public/assets/';

//
// REMEMBER
// Magica voxel is Z up coords. So the vec 3s below are [x,z,y]
//

const getMVoxNode = (err, data) => {
  const mvox = parseMagicaVoxel(data);
  debugger;

  //https://github.com/mikolalysenko/ao-mesher/blob/master/mesh.js#L24
  //Voxels are stored in 16bit format.
  //So the ndarray underlying typed array view must be > Int16Array
  //The Int32 usage was copied form examples an Int16 may reduce file size
  //This would also have to be changed in paddVoxelNdArray
  const n = ndarray(
    new Int32Array(mvox.SIZE.x * mvox.SIZE.z * mvox.SIZE.y),
    [mvox.SIZE.x, mvox.SIZE.z, mvox.SIZE.y]
  );

  mvox.XYZI.forEach((voxel) => {
    n.set(
      voxel.x,
      voxel.z,
      voxel.y,
      voxel.c
    )
  });

  //Ndarray voxels need to be padded before ao mesher is applied
  // https://github.com/mikolalysenko/ao-mesher/issues/7
  const paddedVoxels = paddVoxelNDArray(n);


  const aoMesh = createAOMesh(paddedVoxels);

  //key here is to use vertData.buffer
  fs.writeFile(`${outputDir}${fileName}.aoverts`, aoMesh, (err) => {
    if(err) throw err;
    console.log(`${outputDir}${fileName}.aoverts bytes:`, aoMesh.byteLength);
  });
}

fs.readFile(filepath, getMVoxNode);
