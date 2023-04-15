module.exports = (vertData, palette) => {
  let vertPalette = [], paletteIndex;
  var i = 0;
  //Last byte of the vertdata is "tex Id" which can be used for palete id
  while(i < vertData.length){
    paletteIndex = vertData[i+7] - 1;
    vertPalette.push(palette[paletteIndex]);
    i+=8;
  }
  
  vertPalette = vertPalette.reduce((accum, val) => {
    return accum.concat(val);
  }, []);
  
  return vertPalette;
}