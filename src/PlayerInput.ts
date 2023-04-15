import { vec2 } from 'gl-matrix';
import { action, makeObservable } from 'mobx';
import { ConstrainedMixin } from './types/ConstrainedMixin';
import Entity from './Entity';

const doubleTapTimeout = 0.5;



type PlayerInputMixin = ConstrainedMixin<Entity &
                        {engine?: vec2, vertVelocity?: number, trigger?: boolean}
>;

export interface IMove {
  jump(): void
}

interface ITapMap {
  [index: string]: 0 | 1
}

export default function PlayerInput<TBase extends PlayerInputMixin>(superclass: TBase) {
  class PlayerInput extends superclass implements IMove {
    doubleTapMoveTimeoutMap: ITapMap = {
      "0,1": 0,
      "0,-1": 0,
      "1,1": 0,
      "1,-1": 0,
    };

    moveAxisDirection: vec2 = [
      0, // 0 stationary, 1 forward, -1 backwards
      0  // 0 stationary 1 right, -1 left;
    ];

    lookAxisDirection: vec2 = [
      0, // 0 stationary, 1 forward, -1 backwards
      0  // 0 stationary 1 right, -1 left;
    ];

    jumpStrength = 150;
    boostStrength = 5;
    jetpackin = false;
    gravity = -4;

    dashing = false

    constructor(...args: any[]){
      super(args[0]);

      makeObservable(this, {
        tickHandler: action,
        setMoveAxisDirection: action,
        jump: action,
        releaseJump: action,
        setLookAxisDirection: action
      });

      this.on('tick', this.tickHandler)

      this.on('jump', this.jump);
      this.on('releaseJump', this.releaseJump);

      this.on('movePress', this.setMoveAxisDirection);
      this.on('movePress', this.startDashCombo);

      this.on('moveRelease', this.setMoveAxisDirection);
      this.on('moveRelease', this.endDash);

      this.on('startDash', () => this.dashing = true)
      this.on('stopDash', () => this.dashing = false)

      this.on('primaryTrigger', () => this.trigger = true)
      this.on('primaryRelease', () => this.trigger = false)

      this.on('lookMove', this.setLookAxisDirection);
    }

    //Cooldowns on double taps
    tickHandler(deltaTime: number) {
      if(this.doubleTapMoveTimeoutMap['0,1'] > 0){
        this.doubleTapMoveTimeoutMap['0,1'] -= deltaTime;
      }
      if(this.doubleTapMoveTimeoutMap['0,-1'] > 0){
        this.doubleTapMoveTimeoutMap['0,-1'] -= deltaTime;
      }
      if(this.doubleTapMoveTimeoutMap['1,1']){
        this.doubleTapMoveTimeoutMap['1,1'] -= deltaTime;
      }
      if(this.doubleTapMoveTimeoutMap['1,-1']){
        this.doubleTapMoveTimeoutMap['1,-1'] -= deltaTime;
      }
    }

    startDashCombo(axis: number, direction: number){
      const doubleTapKey = `${axis},${direction}`;
      if(Boolean(~this.doubleTapMoveTimeoutMap[doubleTapKey])){
        this.doubleTapMoveTimeoutMap[doubleTapKey] += doubleTapTimeout;
      }

      if(
        this.doubleTapMoveTimeoutMap['0,1'] > doubleTapTimeout ||
        this.doubleTapMoveTimeoutMap['0,-1'] > doubleTapTimeout ||
        this.doubleTapMoveTimeoutMap['1,1'] > doubleTapTimeout ||
        this.doubleTapMoveTimeoutMap['1,-1'] > doubleTapTimeout
      ){
        this.emit('startDash');
        this.doubleTapMoveTimeoutMap['0,1'] = 0;
        this.doubleTapMoveTimeoutMap['0,-1'] = 0;
        this.doubleTapMoveTimeoutMap['1,1'] = 0;
        this.doubleTapMoveTimeoutMap['1,-1'] = 0;
       }
    }

    endDash(axis: number, direction: number){
      if(this.moveAxisDirection[0] === 0 && this.moveAxisDirection[1] === 0){
        this.emit('stopDash');
        this.doubleTapMoveTimeoutMap[`${axis},${direction}`] = 0;
      }
    }

    setMoveAxisDirection(axis: number, direction: number) {
      this.moveAxisDirection[axis] = direction;
    }

    jump() {
      if(this.vertVelocity === 0){
        this.vertVelocity = this.jumpStrength;
      }

      if(this.engine[0] > 0 && this.position[1] !== 0){
        this.jetpackin = true;
      }
    }

    releaseJump() {
      this.jetpackin = false;
    }

    setLookAxisDirection(lookMovementPayload: {movementX: number, movementY: number}) {
      this.lookAxisDirection[0] += lookMovementPayload.movementX;
      this.lookAxisDirection[1] += lookMovementPayload.movementY;
    }
  }

  return PlayerInput;
}
