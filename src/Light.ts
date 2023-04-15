import { mat4, vec3 } from 'gl-matrix';
import Camera from './Camera';

export default class Light {
  camera: Camera = null
  lightDir: vec3 = [4.5, 1000, 4.8]
  up: vec3 = [0.0, 1.0, 0.0]

  lightViewOut: mat4 = mat4.identity([
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
  ])

  lightProjectionOut: mat4 = mat4.identity([
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
  ])

  frustrumCenterOffsetOut: vec3 = [0,0,0]

  constructor(camera: Camera){
    this.camera = camera;
  }

  get view(){
    return mat4.lookAt(
      this.lightViewOut,
      vec3.add(
        this.frustrumCenterOffsetOut,
        this.camera.frustrumCenterPoint,
        this.lightDir
      ),
      this.camera.frustrumCenterPoint,
      this.up
    );
  }

  get projection(){
    return mat4.ortho(
      this.lightProjectionOut,
      -400, // left
      400, // right
      -400, // bottom
      400, // top
      200, // near
      this.lightDir[1]+1000, // far
    );
  }
}
