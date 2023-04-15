import { vec3, vec2, quat } from 'gl-matrix';
import { action, computed, makeObservable } from 'mobx';
import { ConstrainedMixin } from './types/ConstrainedMixin';
import Entity from './Entity';

const worldFront: vec3 =  [0,0,1];
const worldRight: vec3 = [-1,0,0];
const mouseSensitivity = 2;
const mouseRotationRadians = (Math.PI / 180);
const velocityOut = vec3.create();

type PlayerVelocityMixin = ConstrainedMixin<Entity &
                           {
                             dashing?: boolean;
                             geometryOffset?: vec3;
                             lastCollCenter?: vec3;
                             jetpackin?: boolean;
                             engine?: vec2;
                             broadPhaseCollisions?: any[];
                             collideAndSlide?(lastR3CenterPos: vec3, r3Velocity: vec3): void;
                             jetpacking?: boolean;
                           }>

export default function PlayerVelocity<TBase extends PlayerVelocityMixin>(superclass: TBase) {
  class PlayerVelocity extends superclass{
    moveAxisDirection: vec2 = [
      0, // 0 stationary, 1 forward, -1 backwards
      0  // 0 stationary 1 right, -1 left;
    ];

    lookAxisDirection: vec2 = [
      0, // 0 stationary, 1 forward, -1 backwards
      0  // 0 stationary 1 right, -1 left;
    ];

    forwardDirection = vec3.create();
    strafeDirection = vec3.create();
    viewVertRotation: quat = [0,0,0,0]

    right: vec3 = [0,0,0]
    front: vec3 = [0,0,0]

    vertVelocity = 0; // falling by default
    jumpStrength = 150;
    boostStrength = 5;
    baseSpeed = 50
    gravity = -4;

    constructor(...args: any[]){
      super(args[0])

      makeObservable(this, {
        moveSpeed: computed,
        moveTick: action
      });

      this.on('tick', this.moveTick);
    }

    get moveSpeed() {
      const velocity = this.dashing ? this.baseSpeed + 100 : this.baseSpeed;
      return velocity * Number(this.moveAxisDirection[0] !== 0 || this.moveAxisDirection[1] !== 0)
    }

    moveTick(deltaTime: number) {
      const lastCollCenter = vec3.add(
        [0,0,0],
        this.position,
        this.geometryOffset
      );
      this.lastCollCenter = lastCollCenter;

      //update entity rotation
      quat.rotateY(
        this.rotation,
        this.rotation,
        (this.lookAxisDirection[0] * -1) * mouseRotationRadians * deltaTime * mouseSensitivity
      );
      this.lookAxisDirection[0] = 0;

      quat.rotateX(
        this.viewVertRotation,
        this.viewVertRotation,
        this.lookAxisDirection[1] * mouseRotationRadians * deltaTime * mouseSensitivity
      );

      // Undo Camera rotation if its out of bounds. prevents from rotating vertically around player
      if( this.viewVertRotation[0] > 0.6624021577967087 ||
          this.viewVertRotation[0] < -0.6227438701687958
      ){
        quat.rotateX(
          this.viewVertRotation,
          this.viewVertRotation,
          (this.lookAxisDirection[1] * mouseRotationRadians * deltaTime * mouseSensitivity) * -1
        );
      }
      this.lookAxisDirection[1] = 0;

      vec3.transformQuat(this.right, worldRight, this.rotation)
      vec3.transformQuat(this.front, worldFront, this.rotation)

      vec3.normalize(this.forwardDirection, this.front);
      vec3.scale(
        this.forwardDirection, this.forwardDirection,
        this.moveAxisDirection[0] * this.moveSpeed * deltaTime
      );

      vec3.normalize(this.strafeDirection, this.right);
      vec3.scale(
        this.strafeDirection,
        this.strafeDirection,
        this.moveAxisDirection[1] * this.moveSpeed * deltaTime
      );

      let velocity = vec3.add(velocityOut, this.forwardDirection, this.strafeDirection);

      const vertVelocityTotal = this.jetpackin ?
                                this.vertVelocity + this.boostStrength :
                                this.vertVelocity;


      let newVertVelocity = vertVelocityTotal
      newVertVelocity += this.gravity;
      const vertMovement = newVertVelocity * deltaTime;

      velocity[1] += vertMovement;
      this.vertVelocity = newVertVelocity

      if(this.jetpackin){
        this.engine[0] -= (this.boostStrength*4) * deltaTime;
      }

      // Cap vertical velocity if below kill plane
      if(this.position[1] <= 0 && velocity[1] <=0) velocity[1] = 0;

      // Update position with horizontal and vertical velocities

      vec3.add(this.position, this.position, velocity);


      // check for broad phase collisions
      if(this.broadPhaseCollisions.length){
        // revert the broad phase movement
        vec3.sub(this.position, this.position, velocity);
        // recursively trace narrrow phase and update
        this.collideAndSlide(lastCollCenter, velocity);
      };

      // this is a hardcoded kill plane ground coordinate
      if(this.position[1] <=0){
        this.position[1] = 0;
        this.jetpacking = false;
        this.vertVelocity = 0;
      }

      if(this.position[1] <= 0){
        this.position[1] = 0;
      }
    }
  }

  return PlayerVelocity;
}
