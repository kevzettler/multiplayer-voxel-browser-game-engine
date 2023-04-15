import { observable, action, computed, makeObservable } from 'mobx';
import { AnimationTrigger, interpolateJoints } from 'skeletal-animation-system';

const passiveAnimations = ['aggro', 'jump', 'pose', 'walk', 'fdash'];
const activeAnimations = ['death', 'punch', 'slice', 'damage'];

interface AnimationQueue{
  [index: string]: any,
  active: Array<AnimationTrigger>,
  passive: Array<AnimationTrigger>
}

export default class AnimationController {
  animationTime: number = 0;
  // the idea here is that there will always be an underlying passive animation like
  // idle, walking, falling, dashing
  // and then other animations will be active like damage, attack, death once they're done
  // they will return to the passive state
  animationQueues: AnimationQueue = {
    active: [],
    passive: [{name:'pose', noLoop: false, startTime: 0}],
  };

  jointNames: string[] = []
  jointNums : number[] = []
  skeleton: any = null // TODO set hard type for this
  postHook: Function = null

  constructor(jointNames: string[], skeleton: any){
    makeObservable(this, {
      animationTime: observable,
      animationQueues: observable,
      animationTick: action,
      playAnimation: action,
      currentAnimation: computed({keepAlive: true}),
      interpolatedJoints: computed({keepAlive: true})
    });

    this.skeleton = skeleton;
    this.jointNames = jointNames;
    this.jointNums = jointNames.map((jointName) => skeleton.jointNameIndices[jointName]);
  }

  animationTick(value: number) {
    this.animationTime += value;
    const currentAnimation = this.currentAnimation;
    if(this.animationQueues.active.length){
      const { currentAnimationInfo } = this.interpolatedJoints;
      const totalFrames = Object.keys(this.skeleton.actions[currentAnimation.name]).length-1;
      if(currentAnimationInfo.upperKeyframeNumber >= totalFrames){
        this.animationTime = 0;
        this.animationQueues.active.shift();
      }
    }
  }

  playAnimation(animation: AnimationTrigger) {
    animation = {
      noLoop: false,
      startTime: 0,
      ...animation,
    };

    let animationType = null;
    if(passiveAnimations.includes(animation.name)) animationType = 'passive';
    if(activeAnimations.includes(animation.name)) animationType = 'active';
    if(!animationType) throw "undefined animation type";

    // Skip duplicate animations
    if(
      this.animationQueues[animationType].length &&
      this.animationQueues[animationType][this.animationQueues[animationType].length-1].name === animation.name
    ) return false;

    this.animationQueues[animationType].push(animation);

    if(this.animationQueues.active.length && animationType !== 'passive'){
      this.animationTime = 0;
    }
  }

  get currentAnimation(): AnimationTrigger {
    const animation = this.animationQueues.active.length ?
                      this.animationQueues.active[this.animationQueues.active.length-1] :
                      this.animationQueues.passive[this.animationQueues.passive.length-1];

    return {
      name: animation.name,
      keyframes: this.skeleton.actions[animation.name],
      startTime: animation.startTime,
      noLoop: animation.noLoop,
    };
  }

  // @computed get previousAnimation(){
  //   let animation = {};
  //   if(this.animationQueues.active.length > 1){
  //     animation = this.animationQueues.active[0];
  //   }

  //   return {
  //     name: animation.name,
  //     keyframes: this.skeleton.actions[animation.name],
  //     startTime: animation.startTime,
  //     noLoop: animation.noLoop,
  //   };
  // }

  get interpolatedJoints() {
    const interpolatedJoints = interpolateJoints({
      currentTime: this.animationTime,
      jointNums: this.jointNums,
      currentAnimation: this.currentAnimation,
    });

    if(typeof this.postHook === 'function'){
      return this.postHook(interpolatedJoints);
    }

    return interpolatedJoints;
  }
}
