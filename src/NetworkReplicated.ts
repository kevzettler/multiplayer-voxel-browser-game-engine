import { vec2, vec3, mat4, quat } from 'gl-matrix';
import { extendObservable, observable, computed, action, makeObservable } from 'mobx';
import { ConstrainedMixin } from './types/ConstrainedMixin';
import Entity from './Entity';
import BasePlayer from './BasePlayer';

type NetworkReplicatedMixin = ConstrainedMixin<BasePlayer>;

interface ITime {
  elapsed: number, tickCount: number, curTime: number
}

export interface INetworkSnap {
  time: ITime,
  entity: Entity & {
    animations?: any
    moveAxisDirection?: vec2,
    lookAxisDirection?: vec2,
    jumpVelocity?: number,
    jumpAcceleration?: number,
    dashing?: boolean,
    jetpackin?: boolean
    jumpStrength?: number
  }
}



export default function NetworkReplicated<TBase extends NetworkReplicatedMixin>(superclass: TBase){
  class NetworkReplicated extends superclass {
    networkSnaps: INetworkSnap[] = [];

    lerpEndPosition: vec3 = vec3.create()
    lerpEndRotation: quat = quat.create()

    constructor(...args: any[]){
      super(...args);
      if(this.rootStore.role !== 'client'){
        console.error('NetworkRollback behavior being used on server?');
        return;
      }

      makeObservable(this, {
        networkSnaps: observable,
        latestNetworkSnap: computed({keepAlive: true}),
        networkSnap: action,
        replicatedModelMat: computed({keepAlive: true})
      });

      if(this.children.length){
        this.children.forEach(this.bindChild)
      }

      this.on('tick', this.interpolateRollback);
    }

    interpolatePosition(deltaTime:number): void{
      if(vec3.length(this.lerpEndPosition) === 0) return;
      const diff = Math.abs(vec3.distance(this.position, this.lerpEndPosition))
      if(diff <= this.lerpThresh){
        vec3.copy(this.position, this.lerpEndPosition);
        vec3.set(this.lerpEndPosition, 0,0,0)
        return;
      }
      this.position[0] += (this.lerpEndPosition[0] - this.position[0]) * deltaTime * 3;
      this.position[1] += (this.lerpEndPosition[1] - this.position[1]) * deltaTime * 3;
      this.position[2] += (this.lerpEndPosition[2] - this.position[2]) * deltaTime * 3;
    }

    interpolateRollback(deltaTime: number): void{
      this.interpolatePosition(deltaTime);
      quat.lerp(this.rotation, this.rotation, this.lerpEndRotation,  0.5);
    }

    addChild(child:Entity){
      this.bindChild(child);
      super.addChild(child);
    }

    bindChild(child: Entity){
      if(!this){
        //this seems to be missing on Node.js sometimes??
        // I suspect mobx or something trys to bind to this fn with out a context??
        console.error('******NetworkReplicated:BindChild why tf is `this` undefind??');
      }else{
        child.networkSnap = action('networkSnap', Object.getPrototypeOf(this).constructor.prototype.networkSnap.bind(child));
        extendObservable(child, {networkSnaps: []});
      }
    }

    get latestNetworkSnap() {
      return this.networkSnaps[this.networkSnaps.length-1];
    }

    networkSnap(networkSnap: INetworkSnap) {
      this.networkSnaps[0] = networkSnap;

      if(this.lerpEndPosition){
        vec3.copy(this.lerpEndPosition, networkSnap.entity.position);
      }
      if(this.lerpEndPosition){
        quat.copy(this.lerpEndRotation, networkSnap.entity.rotation);
      }

      if(this.moveAxisDirection){
        vec2.copy(this.moveAxisDirection, networkSnap.entity.moveAxisDirection)
      }
      if(this.lookAxisDirection){
        vec2.copy(this.lookAxisDirection, networkSnap.entity.lookAxisDirection)
      }

      if(this.jumpVelocity){
        this.jumpVelocity = networkSnap.entity.jumpVelocity;
      }

      if(this.jumpAcceleration){
        this.jumpAcceleration = networkSnap.entity.jumpAcceleration;
      }

      if(this.dashing){
        this.jetpackin = networkSnap.entity.dashing;
      }

      if(this.jetpackin){
        this.jetpackin = networkSnap.entity.jetpackin;
      }

      if(this.jumpStrength){
        this.jumpStrength = networkSnap.entity.jumpStrength
      }

      if(networkSnap.entity.animations){
        //@ts-ignore
        this.animations = networkSnap.entity.animations
      }
    }

    get replicatedModelMat() {
      if(
        typeof this.latestNetworkSnap === 'undefined' ||
        !this.networkSnaps.length){
        return mat4.identity([
          0,0,0,0,
          0,0,0,0,
          0,0,0,0,
          0,0,0,0
        ]);
      }

      return mat4.fromRotationTranslationScale(
        [
          0,0,0,0,
          0,0,0,0,
          0,0,0,0,
          0,0,0,0
        ],
        this.latestNetworkSnap.entity.rotation,
        this.latestNetworkSnap.entity.position,
        this.scale
      );
    }
  }

  return NetworkReplicated;
}
