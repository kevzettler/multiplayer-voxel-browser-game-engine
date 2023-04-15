import { mat4, vec4, vec3, quat } from 'gl-matrix';
import {observable, action } from 'mobx';
import RenderStore from './RenderStore';

const front: vec3 = [0,0,1];

export default class Camera {
  @observable eye: vec3 = [0, 30, -100]
  @observable target: vec3 = [0, 0, 0]
  @observable viewWidth = 900//window.innerWidth
  @observable viewHeight = 600//window.innerHeight
  @observable near = 0.1
  @observable far = 1000.0
  renderStore: RenderStore = null

  up: vec3 = [0, 1, 0]
  front: vec3 = [0,0,1]
  rotation: quat = [0,0,0,1]
  vertRotation: vec4 = [0,0,0,1]

  viewMatOut: mat4 = mat4.create() // gl-matrix allocation
  projMatOut = mat4.create() // gl-matrix allocation

  scaleOut = vec3.create();
  negateOut = vec3.create();;

  constructor(
    renderStore: RenderStore,
    width: number,
    height: number
  ){
    this.renderStore = renderStore;
    this.viewWidth = width;
    this.viewHeight = height;
  }

  @action updateCamera(){
    const player = this.renderStore.rootStore.entityStore.localPlayer;

    if(!player){
      return false;
    }

    quat.mul(
      this.rotation,
      player.rotation,
      player.viewVertRotation
    );

    vec3.transformQuat(
      this.front,
      front,
      this.rotation
    );

    // update camera
    vec3.add(
      this.eye,
      player.position,
      player.cameraHeightOffset
    );

    // offset behind player
    vec3.add(
      this.eye,
      this.eye,
      vec3.scale(
        this.scaleOut,
        vec3.negate(this.negateOut, this.front),
        player.cameraDistanceFromPlayer
      )
    );

    this.target = player.viewTargetVec;
  }

  @action setViewPortDimensions(width:number, height: number) {
    this.viewWidth = width;
    this.viewHeight = height;
  }


  get viewMatrix(){
    return mat4.lookAt(
      //this.viewMatOut,
      [
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
      ],
      this.eye,
      this.target,
      this.up
    );
  }

  get projectionMatrix(){
    return mat4.perspective(
      //this.projMatOut,
      [
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
      ],
      Math.PI / 4,
      this.viewWidth / this.viewHeight,
      this.near,
      this.far
    );
  }

  //
  // Frustrum values and below
  //

  inverseView: mat4 = [
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0
  ];

  inverseProjection: mat4 = [
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0
  ];

  clipSpaceNearPlaneCorners = [
    [-1, -1, -1], // (-1, -1, -1) left, bottom, near
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
  ];

  clipSpaceFarPlaneCorners = [
    [-1, -1, 1], // (-1, -1, -1) left, bottom, far
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ];

  clipSpaceCorners = [
    ...this.clipSpaceNearPlaneCorners,
    ...this.clipSpaceFarPlaneCorners,
  ];

  worldSpaceFrustrumCorners: vec4[] = [
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
  ];

  NDCCorner: vec4 = [0,0,0,0];
  viewCornerH: vec4 = [0,0,0,0];
  viewCorner: vec4 = [0,0,0,0];


  get frustrumVerts(){
    mat4.invert(this.inverseView, this.viewMatrix);
    mat4.invert(this.inverseProjection,this.projectionMatrix);

    this.clipSpaceCorners.forEach((clipCorner, index) => {
      vec4.set(
        this.NDCCorner,
        clipCorner[0],
        clipCorner[1],
        clipCorner[2],
        1
      );

      vec4.transformMat4(this.viewCornerH, this.NDCCorner, this.inverseProjection);
      vec4.scale(this.viewCorner, this.viewCornerH, 1/this.viewCornerH[3]);

      vec4.transformMat4(this.worldSpaceFrustrumCorners[index], this.viewCorner, this.inverseView);

      //@ts-ignore no pop ? on quat??
      this.worldSpaceFrustrumCorners[index].pop(); // drop the last w component value
    })

    return this.worldSpaceFrustrumCorners;
  }

  /* @computed get frustrumAABB(){
   *   return boundingBox(this.frustrumVerts);
   * } */

  // The center of n object is also called the centroid or balanced barycenter.
  // You just have to sum all vectors and then divide by the number of vectors.
  get frustrumCenterPoint(): vec3{
    return this.frustrumVerts.reduce((
      acc: vec3,
      frustrumVert: quat,
      indx,
      origin
    ) => {
      /// Sum all the verts
      acc[0] += frustrumVert[0];
      acc[1] += frustrumVert[1];
      acc[2] += frustrumVert[2];

      // Divide by vert count
      if(indx === origin.length-1){
        acc = <vec3>acc.map((component: number) => component / origin.length);
      }

      return acc;
    }, [0,0,0]);
  }
}
