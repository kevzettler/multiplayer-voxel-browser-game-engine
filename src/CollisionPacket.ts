import { computed, observable, action, makeObservable } from 'mobx';
import { glMatrix, vec3, vec4, mat3 } from 'gl-matrix';
import {
  getNormalForTriPoints,
  testVertex,
  testEdge,
  pointInTriangle,
} from './util/collisions.js';

glMatrix.setMatrixArrayType(Array);

// Colliding plane class
class Plane {
  equation = vec4.create()
  origin = vec3.create()
  normal = vec3.create()

  constructor(
    p1: vec3,
    p2: vec3,
    p3?: vec3
  ){
    this.origin = p1;

    if(!p3){
      this.normal = p2;
    }else{
      this.normal = getNormalForTriPoints(p1,p2,p3);
    }
    vec3.normalize(this.normal, this.normal);

    this.equation[0] = this.normal[0];
    this.equation[1] = this.normal[1];
    this.equation[2] = this.normal[2];
    this.equation[3] = -(this.normal[0]*this.origin[0]+this.normal[1]*this.origin[1]
                        +this.normal[2]*this.origin[2]);
  }

  isFrontFacingTo(directionVector: vec3){
    return vec3.dot(this.normal, directionVector) <= 0;
  }

  signedDistanceTo(pointVector: vec3){
    return vec3.dot(pointVector, this.normal) + this.equation[3];
  }
}

export default class CollisionPacket{
  eRadius = vec3.create();
  CBM = mat3.create(); // change of basis matrix
  iCBM = mat3.create(); // inverted change of basis matrix

  r3Position = vec3.create();
  r3Velocity = vec3.create();

  //Information about the move being requested in eSpace
  eIntersectionPoint = vec3.create();


  foundCollision = false
  planeIntersectionPoint = vec3.create()

  tmpTri: vec3[] = [];
  collisionTri: vec3[] = [];

  p1Out = vec3.create();
  p2Out = vec3.create();
  p3Out = vec3.create();

  timeVelocityOut = vec3.create();

  t = 1.0;

  constructor(eRadius: vec3){
    makeObservable(this, {
      r3Position: observable,
      r3Velocity: observable,
      eIntersectionPoint: observable,
      t: observable,
      ePosition: computed({keepAlive: true}),
      eVelocity: computed({keepAlive: true}),
      eDestination: computed({keepAlive: true}),
      r3IntersectionPoint: computed({keepAlive: true}),
      eVelSquaredLen: computed,
      eVelLen: computed({keepAlive: true}),
      eNormalizedVelocity: computed,
      distanceToCollision: computed({keepAlive: true}),
      eNearestNonIntersectPosition: computed({keepAlive: true}),
      r3NearestNonIntersectPosition: computed({keepAlive: true}),
      SlidingPlane: computed({keepAlive: true}),
      eSlideDestination: computed({keepAlive: true}),
      eSlideVelocity: computed,
      r3SlideVelocity: computed,
      r3SlideDestination: computed({keepAlive: true}),
      reset: action,
      setCollision: action
    });

    this.eRadius = eRadius;
    this.CBM = [
      1/eRadius[0], 0, 0,
      0, 1/eRadius[1], 0,
      0, 0, 1/eRadius[2],
    ];

    mat3.invert(this.iCBM, this.CBM);
  }

  get ePosition() {
    return vec3.transformMat3(
      vec3.create(),
      this.r3Position,
      this.CBM
    );
  }

  get eVelocity() {
    return vec3.transformMat3(
      vec3.create(),
      this.r3Velocity,
      this.CBM
    );
  }

  get eDestination() {
    return vec3.add(
      vec3.create(),
      this.ePosition,
      this.eVelocity
    );
  }

  get r3IntersectionPoint() {
    return vec3.transformMat3(
      vec3.create(),
      this.eIntersectionPoint,
      this.iCBM
    )
  }

  get eVelSquaredLen() {
    return vec3.squaredLength(this.eVelocity);
  }

  get eVelLen() {
    return vec3.length(this.eVelocity);
  }

  get eNormalizedVelocity() {
    return vec3.normalize(
      vec3.create(),
      this.eVelocity
    );
  }

  get distanceToCollision() {
    return this.t * this.eVelLen;
  }

  get eNearestNonIntersectPosition() {
    // /?? maybe this is better distanceCalc const distanceToCollision = vec3.scale([], this.eVelocity, this.t);
    const nearVelocity = vec3.scale([0,0,0], this.eVelocity, this.distanceToCollision);
    return vec3.add(
      vec3.create(),
      this.ePosition,
      nearVelocity
    );
  }

  get r3NearestNonIntersectPosition() {
    return vec3.transformMat3(
      vec3.create(),
      this.eNearestNonIntersectPosition,
      this.iCBM
    );
  }

  get SlidingPlane() {
    const slidePlaneOrigin = vec3.clone(this.eIntersectionPoint);
    const slidePlaneNormal = vec3.sub(
      vec3.create(),
      this.ePosition,
      this.eIntersectionPoint
    );
    return new Plane(slidePlaneOrigin, slidePlaneNormal);
  }

  get eSlideDestination() {
    /*
     * float distance = slidingPlane.distanceTo(destination);
     * VECTOR newDestinationPoint = destination-distance*planeNormal;
     */
    const distance = this.SlidingPlane.signedDistanceTo(this.eDestination)
    const slideDistance = vec3.scale(
      vec3.create(),
      this.SlidingPlane.normal,
      distance
    );
    return vec3.subtract(vec3.create(), this.eDestination, slideDistance);
  }

  get eSlideVelocity() {
    return vec3.subtract(vec3.create(), this.eSlideDestination, this.eIntersectionPoint);
  }

  get r3SlideVelocity() {
    return vec3.transformMat3(vec3.create(), this.eSlideVelocity, this.iCBM)
  }

  get r3SlideDestination() {
    return vec3.transformMat3(vec3.create(), this.eSlideDestination, this.iCBM)
  }

  reset(position:vec3, velocity:vec3) {
    vec3.copy(this.r3Position, position);
    vec3.copy(this.r3Velocity, velocity);
    this.t = 1.0;
    this.foundCollision = false;
    //this.edge = false;
  }

  setCollision(t:number, interesctionPoint: vec3) {
    this.foundCollision = true;

    this.collisionTri = this.tmpTri.slice(0);

    this.t = t;
    vec3.copy(this.eIntersectionPoint, interesctionPoint);
    /* •Move our sphere as close as possible to the triangle we’re colliding with.
       Lets call this position for “newPosition”.
       • Calculate the sliding plane based on this new position.
       • Project the original velocity vector to the sliding plane to get a new
       destination.
       • Make a new velocity vector by subtracting the polygon intersection
       point from the new destination point.
     */
  }

  checkTriangle(triangle: vec3[]){
    this.tmpTri = triangle;

    // convert triangle points into Espace
    const p1 = vec3.transformMat3(this.p1Out, triangle[0], this.CBM);
    const p2 = vec3.transformMat3(this.p2Out, triangle[1], this.CBM);
    const p3 = vec3.transformMat3(this.p3Out, triangle[2], this.CBM);

    // TODO this is expensive AF
    const triPlane = new Plane(p1,p2,p3);

    if(triPlane.isFrontFacingTo(this.eNormalizedVelocity)){
      let t0, t1, embeddedInPlane = false;
      const signedDistToTrianglePlane = triPlane.signedDistanceTo(this.ePosition);
      const normalDotVelocity = vec3.dot(triPlane.normal, this.eVelocity);

      if(normalDotVelocity >= 0.0){
        if(Math.abs(signedDistToTrianglePlane) >= 1.0){
          // Sphere is not embedded in plane.
          // No collision possible:
          return this;
        } else {
          // Sphere is completely embedded in plane.
          // It intersects in the whole range [0..1]
          embeddedInPlane = true;
          t0 = 0.0;
          t1 = 1.0;
        }
      } else {
        // N dot D is not 0. Calculate intersection interval:
        t0=(-1.0-signedDistToTrianglePlane)/normalDotVelocity;
        t1=(1.0-signedDistToTrianglePlane)/normalDotVelocity;
        // Swap so t0 < t1
        if (t0 > t1) {
          let temp = t1;
          t1 = t0;
          t0 = temp;
        }
        // Check that at least one result is within range:
        if (t0 > 1.0 || t1 < 0.0) {
          // Both t values are outside values [0,1]
          // No collision possible:
          return this;
        }
        // Clamp to [0,1]
        if (t0 < 0.0) t0 = 0.0;
        if (t1 < 0.0) t1 = 0.0;
        if (t0 > 1.0) t0 = 1.0;
        if (t1 > 1.0) t1 = 1.0;
      }

      // If the closest possible collision point is further away
      // than an already detected collision then there's no point
      // in testing further.
      if(t0 >= this.t) { return this; }

      // OK, at this point we have two time values t0 and t1
      // between which the swept sphere intersects with the
      // triangle plane. If any collision is to occur it must
      // happen within this interval.

      // First we check for the easy case - collision inside
      // the triangle. If this happens it must be at time t0
      // as this is when the sphere rests on the front side
      // of the triangle plane. Note, this can only happen if
      // the sphere is not embedded in the triangle plane.
      if(!embeddedInPlane){
        vec3.subtract(
          this.planeIntersectionPoint,
          this.ePosition,
          triPlane.normal
        )

        const v = vec3.scale(this.timeVelocityOut, this.eVelocity, t0)
        vec3.add(this.planeIntersectionPoint, this.planeIntersectionPoint, v);

        if(pointInTriangle(this.planeIntersectionPoint, p1,p2,p3)){
          //Collision detected
          this.setCollision(t0, this.planeIntersectionPoint);
          return this;
        }
      }

      let t = this.t;

      // Check for collision against the triangle vertices:
      t = testVertex(p1, t, this);
      t = testVertex(p2, t, this);
      t = testVertex(p3, t, this);

      // Check for collision against the triangle edges:
      t = testEdge(p1, p2,  t, this);
      t = testEdge(p2, p3,  t, this);
      testEdge(p3, p1,  t, this);
      return this;
    }
  }
}
