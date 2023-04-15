import { mat4 } from 'gl-matrix';
import { computed, makeObservable } from 'mobx';
import convertDualQuatToMatrix from 'dual-quat-to-mat4';
import mechSniperActions from './assets/mechsniper-actions.js';
import AnimationController from './AnimationController';
import { ConstrainedMixin } from './types/ConstrainedMixin';

import Entity from './Entity';
import { IAssetDependant } from './AssetDependency';

export interface IAnimate {
  controllers: AnimationController[];
  animJoints: mat4[]
  skeleton: any
  animationOriginOffset: mat4
}

export type Animate = ConstrainedMixin<Entity & IAssetDependant>;

export default function Animate<TBase extends Animate>(superclass: TBase) {
  class Animate extends superclass implements IAnimate {
    skeleton: any = mechSniperActions
    dashing: boolean = false
    jointsPlaceholder: mat4[] = []
    jointSets: any[] = []
    controllers: AnimationController[]

    //FIXME where should this thing live?
    weapon: string = null

    constructor(...args: any[]) {
      super(...args);

      makeObservable(this, {
        animationOriginOffset: computed,
        animJoints: computed({ keepAlive: true })
      });

      const props = args[0];
      if (props.weapon) this.weapon = props.weapon

      this.jointsPlaceholder = [...Array(Object.keys(this.skeleton.jointNameIndices).length)]
        .map(() => mat4.identity([
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0
        ]));

      this.jointSets = [];
      const upperJoints = [
        'Chest',
        'Head',
        'ElbowL',
        'ElbowR',
        'ShoulderL',
        'ShoulderR',
        'BicepL',
        'BicepR',
        'ArmL',
        'ArmR',
        'HandL',
        'HandR',
      ];
      this.jointSets.push(upperJoints);

      const lowerJoints = [
        'Root',
        'Waist',
        'KneeL',
        'KneeR',
        'FootR',
        'FootL',
        'ShinL',
        'ShinR',
        'ThighR',
        'ThighL',
      ];
      this.jointSets.push(lowerJoints);

      this.controllers = this.jointSets.map(
        (jointSet: string[]) => new AnimationController(jointSet, this.skeleton)
      );


      // //Move the legs in the strafe direction
      // //May not need this infavor of a strafe animation
      // this.controllers[1].postHook = function (interpolatedJoints){
      //   if(this.moveAxisDirection && this.moveAxisDirection[1] !== 0){
      //     Object.keys(interpolatedJoints).forEach(function jointIterator(jointId){
      //       var newJoint = quat2.rotateY([],
      //                                    interpolatedJoints.joints[jointId],
      //                                    -this.moveAxisDirection[1] * (Math.PI/6))
      //       interpolatedJoints.joints[jointId] = newJoint;
      //     }.bind(this));
      //   }

      //   return interpolatedJoints;
      // }.bind(this);

      this.on('tick', (deltaTime: number) => {
        this.controllers.forEach((c: AnimationController) => c.animationTick(deltaTime));
      });

      this.on('jump', () => {
        this.controllers.forEach((c: AnimationController) => c.playAnimation({ name: 'jump' }));
      });

      this.on('touchdown', () => {
        this.controllers.forEach((c: AnimationController) => c.playAnimation({ name: 'walk' }));
      });

      this.on('startDash', () => {
        this.dashing = true;
        this.controllers.forEach((controller: AnimationController) => {
          controller.playAnimation({ name: 'fdash' });
        });
      })

      this.on('stopDash', () => { this.dashing = false })

      this.on('movePress', (ax1, ax2, walkStyle: string = 'aggro') => {
        this.controllers.forEach((controller: AnimationController) => {
          if (this.dashing) {
            controller.playAnimation({ name: 'fdash' });
          } else {
            controller.playAnimation({ name: walkStyle });
          }
        });
      });

      this.on('moveRelease', () => {
        if (
          this.parent.moveAxisDirection[0] === 0 &&
          this.parent.moveAxisDirection[1] === 0
        ) {
          this.controllers.forEach((controller: AnimationController) => controller.playAnimation({ name: 'pose' }));
        }
      });

      this.on('shoot', () => {
        this.controllers[0].playAnimation({ name: 'aggro', noLoop: true });
      });

      this.on('primaryTrigger', () => {
        if (this.weapon && this.weapon === 'standardGun') {
          this.controllers[0].playAnimation({ name: 'aggro', noLoop: true });
        } else {
          this.controllers.forEach((controller: AnimationController) => controller.playAnimation({ name: 'slice', noLoop: true }));
        }
      });

      this.on('damage', () => {
        console.log("Playing DAMAGE ANIM");
        this.controllers.forEach((controller: AnimationController) => controller.playAnimation({ name: 'damage', noLoop: true }));
      });
    }

    // FIXME TODO Need to calculate this with out the Sword in...
    // when there is an oblong object in the entities position
    // entities/selectors.js#L66-L82
    get animationOriginOffset(): mat4 {
      if (!this.assetAABB) {
        return mat4.identity(mat4.create())
      }
      return mat4.fromTranslation(
        mat4.create(),
        [
          -Math.floor(this.assetAABB[1][0] / 2),
          0, //don't recenter on the Y axis
          -Math.floor(this.assetAABB[1][2] / 2)
        ]
      );
    }

    get animJoints(): mat4[] {
      const interpolatedJoints = Object.assign(
        {},
        this.controllers[0].interpolatedJoints.joints,
        this.controllers[1].interpolatedJoints.joints,
      );

      Object.keys(interpolatedJoints).forEach((i: string) => {
        this.jointsPlaceholder[parseInt(i)] = convertDualQuatToMatrix(this.jointsPlaceholder[parseInt(i)], interpolatedJoints[i]);
      });

      return this.jointsPlaceholder;
    }

    get animations() {
      return this.controllers.map((animationController) => animationController.animationQueues)
    }

    set animations(animationQueues: any) {
      this.controllers[0].animationQueues = animationQueues[0];
      this.controllers[1].animationQueues = animationQueues[1];
    }

  }

  return Animate;
}
