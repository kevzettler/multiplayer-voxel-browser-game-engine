export const getTotalByteLengthOfBufferLikes = (buffers) => {
  return buffers.reduce((acc, buffer) => {
    acc += buffer.length;
    return acc;
  }, 0);
}

export const mergeFloatBuffers = (bufferList) => {
  const totalBufferLength = getTotalByteLengthOfBufferLikes(bufferList);

  const tmp = new Float32Array(totalBufferLength);

  var lastInd = 0;
  var fbuff;

  bufferList.forEach((buffer) => {
    fbuff = new Float32Array(buffer);
    tmp.set(fbuff, lastInd);
    lastInd += fbuff.length;
  });

  return tmp;
}
