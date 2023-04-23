import { vec3, mat4, quat } from 'gl-matrix';
import { observable, computed, action, makeObservable } from 'mobx';
import { ConstrainedMixin } from './types/ConstrainedMixin';
import Entity from './Entity';
import BasePlayer from './BasePlayer';

type NetworkRollbackMixin = ConstrainedMixin<BasePlayer>;

interface ITime {
  elapsed: number, tickCount: number, curTime: number
}

interface INetworkSnap {
  time: ITime,
  entity: Entity
}

interface IinputPayload {
  type: string;
  args: any[];
  time: ITime;
}

export default function NetworkRollback<TBase extends NetworkRollbackMixin>(superclass: TBase) {
  class NetworkRollback extends superclass {
    divergenceThres = 25
    lerpThresh = 3

    networkSnaps: INetworkSnap[] = [];

    localInputs: IinputPayload[] = [];

    // event gets added dynamically by the EventeEmitter baseclass
    event = ''

    rollbackStartPosition: vec3 = vec3.create()
    rollbackStartRotation: quat = quat.create()

    lerpEndPosition: vec3 = vec3.create()
    lerpEndRotation: quat = quat.create()

    constructor(...args: any[]) {
      super(...args);

      // important
      //Don't do anything for this behavior on the server
      //localSnap is expensive
      if (this.rootStore.role !== 'client') {
        console.error('NetworkRollback behavior being used on server?');
        return;
      }

      makeObservable(this, {
        networkSnaps: observable,
        localInputs: observable,
        captureInput: action,
        latestNetworkSnap: computed({ keepAlive: true }),
        networkSnap: action,
        replicatedModelMat: computed({ keepAlive: true })
      });


      this.on('jump', this.captureInput);
      this.on('releaseJump', this.captureInput);
      this.on('movePress', this.captureInput);
      this.on('movePress', this.captureInput);
      this.on('moveRelease', this.captureInput);
      this.on('moveRelease', this.captureInput);
      this.on('startDash', this.captureInput)
      this.on('stopDash', this.captureInput);
      this.on('primaryTrigger', this.captureInput)
      this.on('primaryRelease', this.captureInput)
      this.on('lookMove', this.captureInput)

      this.on('tick', this.interpolateRollback)
    }

    interpolatePosition(_deltaTime: number): void {
      if (vec3.length(this.lerpEndPosition) === 0) return;
      const diff = Math.abs(vec3.distance(this.position, this.lerpEndPosition))

      // if the distance is within the lerp threshold
      // snap it in place
      if (diff <= this.lerpThresh) {
        console.log(
          'Lerp ',
          diff,
          "<=",
          this.lerpThresh,
        );
        vec3.copy(this.position, this.lerpEndPosition);
        // clear the lerp end pointw
        vec3.set(this.lerpEndPosition, 0, 0, 0)
        return;
      }

      vec3.lerp(this.position, this.position, this.lerpEndPosition, 0.3);
    }

    interpolateRollback(deltaTime: number): void {
      this.interpolatePosition(deltaTime);
    }

    captureInput(...args: any[]) {
      if (args[args.length - 1] === 'replay') return;

      this.localInputs.push({
        type: this.event,
        args: [...args],
        time: {
          elapsed: this.rootStore.loop._elapsed,
          tickCount: this.rootStore.loop._tickCount,
          curTime: this.rootStore.loop._curTime,
        }
      })
    }

    haveStatesDiverged(
      remoteState: INetworkSnap
    ) {
      const distanceDiff = Math.abs(vec3.distance(
        this.position,
        remoteState.entity.position
      ));

      const timeDiff = Math.abs(this.networkSnaps[0].time.elapsed - this.rootStore.loop._elapsed);
      const tickDiff = Math.abs(this.networkSnaps[0].time.tickCount - this.rootStore.loop._tickCount);
      const divergenceScale = this.divergenceThres * (tickDiff / 100)
      const divergenceTrigger = this.divergenceThres + divergenceScale;

      if (distanceDiff > divergenceTrigger) {
        console.log(
          'tresh',
          this.divergenceThres,
          'scaler',
          (tickDiff / 100),
          "divergenceScale",
          divergenceScale,
          "divergenceTrigger",
          divergenceTrigger
        );
        console.log(
          "Rollback Divergence", distanceDiff, '>', divergenceTrigger,
          'distance', distanceDiff,
          'time', timeDiff,
          'tick', tickDiff
        );

        return true;
      }

      return false;
    }

    get latestNetworkSnap() {
      return this.networkSnaps[this.networkSnaps.length - 1];
    }

    networkSnap(networkSnap: INetworkSnap) {
      this.networkSnaps[0] = networkSnap;

      // discard any local snaps that occur
      // before the latest network snap
      while (
        this.localInputs.length &&
        this.localInputs[0].time.curTime < networkSnap.time.curTime
      ) {
        this.localInputs.shift();
      }

      if (
        this.haveStatesDiverged(this.networkSnaps[0])
      ) {
        // copy the current position and rotation
        vec3.copy(this.rollbackStartPosition, this.position);
        quat.copy(this.rollbackStartRotation, this.rotation);

        // reset to the remote state
        vec3.set(
          this.position,
          this.networkSnaps[0].entity.position[0],
          this.networkSnaps[0].entity.position[1],
          this.networkSnaps[0].entity.position[2],
        );

        quat.set(
          this.rotation,
          this.networkSnaps[0].entity.rotation[0],
          this.networkSnaps[0].entity.rotation[1],
          this.networkSnaps[0].entity.rotation[2],
          this.networkSnaps[0].entity.rotation[3],
        );

        // replay local inputs to bring entity up to date
        while (this.localInputs.length) {
          const replayTicks = this.networkSnaps[0].time.tickCount - this.localInputs[0].time.tickCount;
          //replay ticks between event

          for (var i = 0; i > replayTicks; i++) {
            this.emit(
              'tick',
              this.rootStore.loop._fixedDeltaTime,
              this.rootStore.loop._elapsed,
              this.networkSnaps[0].time.tickCount + i
            );
          }

          // replay event
          // this causes an infinite loop because the captureInput
          // event will also capture these so we append replay to the end of arguments
          const extended = [...this.localInputs[0].args, 'replay'];
          this.emit(this.localInputs[0].type, ...extended);

          //move to next event
          this.localInputs.shift();
        }

        // Set lerp end positions with the new rollbacks
        // This will trigger the 'tick' handler to start interpolation
        vec3.copy(this.lerpEndPosition, this.position);
        quat.copy(this.lerpEndRotation, this.rotation);

        //Reset entity positions to start of the rollback
        vec3.copy(this.position, this.rollbackStartPosition);
        quat.copy(this.rotation, this.rollbackStartRotation);

      }
    }

    get replicatedModelMat() {
      if (
        typeof this.latestNetworkSnap === 'undefined' ||
        !this.networkSnaps.length) {
        return mat4.identity([
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0
        ]);
      }

      return mat4.fromRotationTranslationScale(
        [
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0
        ],
        this.latestNetworkSnap.entity.rotation,
        this.latestNetworkSnap.entity.position,
        this.scale
      );
    }
  }

  return NetworkRollback;
}
