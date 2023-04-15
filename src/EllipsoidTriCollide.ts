import createEllipsoid from 'primitive-ellipsoid';
import { computed, autorun, makeObservable } from 'mobx';
import { glMatrix, vec3 } from 'gl-matrix';

import CollisionPacket from './CollisionPacket';
import { ConstrainedMixin } from './types/ConstrainedMixin';
import Entity from './Entity';
import { IBroadPhaseBox } from './BroadPhaseBox';
import { IGeometry}  from './Geometry';
import { ICollisionHull } from './CollisionHull';
import { IEllipsoidGeometry } from './EllipsoidGeometry';

glMatrix.setMatrixArrayType(Array);

function checkTriangles(
  colPacket: CollisionPacket,
  triangles: vec3[][]
){
  for(var i =0; i<triangles.length; i++){
    colPacket.checkTriangle(triangles[i]);
    if(colPacket.foundCollision){
      break;
    }
  }
  return colPacket;
}

type EllipsoidTriMixin = ConstrainedMixin<Entity &
                         {jetpacking?: boolean, vertVelocity?: number} &
                         IGeometry &
                         IEllipsoidGeometry &
                         IBroadPhaseBox>;

export default function EllipsoidTriCollideBehavior<TBase extends EllipsoidTriMixin>(superclass: TBase){
  class EllipsoidTriCollideBehavior extends superclass {
    collideRecurse = 0
    maxCollideRecurse = 2
    minSlideDist = 0.02

    colPacket: CollisionPacket = null

    constructor(...args:any[]){
      super(args[0]);

      makeObservable(this, {
        collisionSphere: computed({keepAlive: true}),
        collidingTriangles: computed({keepAlive: true})
      });

      autorun(() => {
        this.colPacket = new CollisionPacket(this.eGeoRadius);
      })
    }

    // TODO need to roll my own primitive-ellipsoid
    get collisionSphere() {
      const rad = this.eGeoRadius;
      return createEllipsoid(1, {
	latSegments: 16,
	lngSegments: 16,
	rx: rad[0],
	ry: rad[1],
	rz: rad[2],
      });
    }

    //
    // WARNING
    //
    // This only works if
    // glMatrix.setMatrixArrayType(Array); is set
    //
    // This implies there is some functionality that is dependant on
    // Glmatrix using underlying arrays instead of typedArrays
    // this must be set on both client and server
    //
    narrowPhaseCollisions(
      r3Position: vec3,
      r3Velocity: vec3
    ){
      this.colPacket.reset(r3Position, r3Velocity);
      return checkTriangles(this.colPacket, this.collidingTriangles);
    }

    collideAndSlide(
      lastR3CenterPos: vec3,
      r3Velocity: vec3
    ): void{
      if(vec3.length(r3Velocity) <= 0) return;

      const horizontal = vec3.set(vec3.create(), r3Velocity[0], 0, r3Velocity[2]);
      const slideVelocity = vec3.create();

      // horizontal collision
      if(
        this.narrowPhaseCollisions(lastR3CenterPos, horizontal).foundCollision
      ){
        vec3.add(slideVelocity, slideVelocity, this.colPacket.r3SlideVelocity);
      } else {
        vec3.add(this.position, this.position, horizontal);
      }

      const newCenter = vec3.add(vec3.create(), this.position, this.geometryOffset);
      const vertical = vec3.set(vec3.create(), 0, r3Velocity[1], 0);
      const vertCollision = this.narrowPhaseCollisions(newCenter, vertical).foundCollision;
      if( vertCollision ) {
        const newVert: vec3 = [
          this.position[0],
          this.colPacket.r3NearestNonIntersectPosition[1] - (this.localAABB[1][0] / 2),
          this.position[2]
        ];

        vec3.add(
          newVert,
          newVert,
          this.colPacket.r3SlideVelocity,
        );

        vec3.add(slideVelocity, slideVelocity, this.colPacket.r3SlideVelocity);


        if(this.jetpacking) this.jetpacking = false;
        if(this.vertVelocity) this.vertVelocity = 0;

      }else{
        vec3.add(this.position, this.position, vertical);
      }


      if(vec3.length(slideVelocity) < this.minSlideDist) return; //miniscule sliding velocity will not recurse
      if(this.collideRecurse === 0) this.collideRecurse = this.maxCollideRecurse; // start recursively calling the collide and slide to get final positions
      this.collideRecurse--;
      if(this.collideRecurse === 0){
        return // exit recursion
      }else{

        // add to the slide velocity to its not as sticky?
        // vec3.scale(slideVelocity, slideVelocity, 1);

        // Recurse untill not colliding
        return this.collideAndSlide(
          this.getCenterPointFromPosition(this.position),
          slideVelocity,
        );
      }
    }

    get collidingTriangles() {
      return this.broadPhaseCollisions
                 .flatMap(function assetTriangleFlatMap(entity: ICollisionHull) {
                   return entity.collisionTriangles? entity.collisionTriangles : []
                 });
    }
  }


  return EllipsoidTriCollideBehavior;
}
