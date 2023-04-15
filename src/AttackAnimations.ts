import Entity from './Entity';
import { IAnimate } from './Animate';
import { ConstrainedMixin } from './types/ConstrainedMixin';

type AttackAnimationMixin = ConstrainedMixin<Entity & IAnimate>;

// dependant on animate class
// Read animation frames for 'attack frames'
// dependant on 'hit boxes'
// during attack frames emit hit event on hitboxes colliders
export default function AttackAnimation<TBase extends AttackAnimationMixin>(superclass: TBase){
  return class AttackAnimation extends superclass {
    constructor(...args: any[]){
      super(args[0]);

      this.on('tick', () => {
        if(
          (this.controllers[0].currentAnimation.name === 'slice' || this.controllers[0].currentAnimation.name === 'punch')
          && this.controllers[0].interpolatedJoints.currentAnimationInfo.lowerKeyframeNumber > 1
          && this.controllers[0].interpolatedJoints.currentAnimationInfo.lowerKeyframeNumber < 4
        ){
          if(
            this.children[0].broadPhaseCollisions.length
          ){
            // this is a super hack. this skips the rest of the keyframes
            // and puts the animation onto the return interpolation
            this.controllers[0].animationTime = 1.98;
            this.controllers[1].animationTime = 1.98;

            this.children[0].broadPhaseCollisions.forEach((c: Entity) => c.emit('damage'))
          }
        }
      });
    }
  }
}
