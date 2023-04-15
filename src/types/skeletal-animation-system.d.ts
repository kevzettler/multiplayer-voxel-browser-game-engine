declare module 'skeletal-animation-system'{

  export interface AnimationTrigger {
    name: string
    noLoop?: boolean
    startTime?: number
    keyframes?: any[]
  }


  interface InterpolatedJoints {
    joints: any;
    currentAnimationInfo: {
      lowerKeyframeNumber: undefined;
      upperKeyframeNumber: undefined;
    };
  }

  interface interOpts {
    currentTime: number,
    jointNums: Array<Number>,
    currentAnimation: AnimationTrigger
  }

  export function interpolateJoints(opts: interOpts): InterpolatedJoints
}
