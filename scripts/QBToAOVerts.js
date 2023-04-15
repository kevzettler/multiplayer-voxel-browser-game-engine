var ndarray = require("ndarray");
var createAOMesh = require("ao-mesher");
var parseQubicle = require('parse-qubicle');
var paddVoxelNDArray = require('./paddVoxelNDArray.js');
var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));
var mechSniperActions = require('../src/assets/mechsniper-actions.json');

//Convert Blender JointNames to match Qubicle Chunk names Foot.R -> FootR
Object.keys(mechSniperActions.jointNameIndices).forEach((jointName) => {
  if (jointName.match(/\./)) {
    var newName = jointName.replace('.', '');
    mechSniperActions.jointNameIndices[newName] = mechSniperActions.jointNameIndices[jointName];
    delete mechSniperActions.jointNameIndices[jointName]
  }
});

const filepath = argv._[0];

const pathChunks = filepath.split('/')
const fileName = pathChunks[pathChunks.length - 1].split('.')[0];

const outputDir = './public/assets/';

const paletteMap = {};

function qbToNDArray(qbMatrix) {
  const x = qbMatrix.sizeX
  const y = qbMatrix.sizeY
  const z = qbMatrix.sizeZ

  const n = ndarray(
    new Int32Array(x * y * z),
    [x, y, z]
  );


  var jointId = mechSniperActions.jointNameIndices[qbMatrix.name];
  const weaponRegEx = /(Gun|Sword)(L|R)/g;

  if (!jointId) {
    const capture = weaponRegEx.exec(qbMatrix.name)
    if (capture) {
      jointId = mechSniperActions.jointNameIndices[`Hand${capture[2]}`];
    } else {
      jointId = mechSniperActions.jointNameIndices['Chest'];
    }
  }

  qbMatrix.matrix.forEach(function (voxel, index) {
    const colorKey = [voxel.r, voxel.g, voxel.b].join('|');
    if (typeof paletteMap[colorKey] === 'undefined') {
      paletteMap[colorKey] = Object.keys(paletteMap).length;
    }

    if (jointId > 25) throw `Overflow error on ${qbMatrix.name} jontId > 25`;
    if (paletteMap[colorKey] > 9) throw `Overflow error on ${qbMatrix.name} palette > 9 `;
    if (jointId === 25 && paletteMap[colorKey] > 5) throw `Overflow error on ${qbMatrix.name} jointId == 25 palete `;

    //This is a hack
    //The joint and palette indexs are packed in to a byte 255 max
    //because joint can be > 15 we can't use 2, 4bit numbers
    // joint=25 + palette=5 = combo=255
    // they are seperated by decimal digits
    const jointAndPaletteDecmialCombo = Number(String(jointId) + String(paletteMap[colorKey]));

    if (jointAndPaletteDecmialCombo > 255) throw "Overflow on joint and palette index";

    console.log(`${qbMatrix.name}: voxel: ${index} joinId ${jointId} + palette ${paletteMap[colorKey]} = `, jointAndPaletteDecmialCombo);
    n.set(
      voxel.x,
      voxel.y,
      voxel.z,
      jointAndPaletteDecmialCombo,
    );
  });

  return n;
};

const getQBFile = (err, data) => {
  var qbMatrix = parseQubicle(data);

  qbMatrix.matrixList.forEach((matrix, index) => {
    var ndvoxels = qbToNDArray(matrix, index);
    var voxelsWithPadding = paddVoxelNDArray(ndvoxels);
    var aoMesh = createAOMesh(voxelsWithPadding);

    //Qubicle comes in layers offset from the center of a world model
    //The voxels are converted to verts in condensed local voxel space
    //This loses the world offset value
    //This offset has to be added to the ndarray for the space size
    //Additional, this offset then needs to be applied to individual voxels
    //I can't bump the verts here because some of the offsets are negative and
    //This offsets them from 0,0,0 origin. They are then centered in code at import time
    var i = 0;
    while (i < aoMesh.length) {
      aoMesh[i] += matrix.posX;
      aoMesh[i + 1] += matrix.posY;
      aoMesh[i + 2] += matrix.posZ;

      // we pack two values in to the last byte.
      // the tex_id/palette index and the joint index
      //aoMesh[i+7]
      i += 8;
    }

    console.log('palette:', paletteMap);
    fs.writeFile(`${outputDir}${fileName}-${matrix.name}.aoverts`, aoMesh, (err) => {
      if (err) throw err;
      console.log(`${outputDir}${fileName}-${matrix.name}.aoverts `, aoMesh.byteLength);
    });
  });
};
fs.readFile(filepath, getQBFile);
