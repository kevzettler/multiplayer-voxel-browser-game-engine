import { computed, makeObservable } from 'mobx';
import { vec3, mat4 } from 'gl-matrix';
import {
  vertsFromAABB,
  AABBintersectAABB,
} from './util/collisions.js';
import boundingBox from 'vertices-bounding-box';

import { ConstrainedMixin, MergeCtor, GetProps } from './types/ConstrainedMixin';
import Entity from './Entity';
import { IGeometry}  from './Geometry';

type BroadPhaseBoxMixin = ConstrainedMixin<Entity & IGeometry>;

interface IBroadPhaseBoxProps {
  broadPhaseBoxPadding?: vec3;
  broadPhaseIgnoreIDs: string[]
}

export interface IBroadPhaseBox{
  broadPhaseBoxPadding: vec3;
  localAABB: vec3[]
  getCenterPointFromPosition(position: vec3): vec3
  broadPhaseCollisions: unknown[]
  broadPhaseIgnoreIDs?: string[]
}

export default function BroadPhaseBox<TBase extends BroadPhaseBoxMixin>(Base: TBase){
  class BroadPhaseBox extends (Base as any) implements IBroadPhaseBox {
    broadPhaseBoxPadding: vec3 = [0,0,0]
    broadPhaseIgnoreIDs: string[] = []

    constructor(props: IBroadPhaseBoxProps & GetProps<TBase>){
      super(props)

      makeObservable(this, {
        localAABB: computed({keepAlive: true}),
        localAABBVerts: computed({keepAlive: true}),
        worldAABBVerts: computed({keepAlive: true}),
        worldAABB: computed({keepAlive: true}),
        AABBScale: computed({keepAlive: true}),
        centerPoint: computed({keepAlive: true}),
        centerTop: computed,
        aabbRenderPayload: computed({keepAlive: true}),
      })
      if(props.broadPhaseBoxPadding) this.broadPhaseBoxPadding = props.broadPhaseBoxPadding;
      if(props.broadPhaseIgnoreIDs) this.broadPhaseIgnoreIDs = props.broadPhaseIgnoreIDs;
    }

    get localAABB(){
      let box = boundingBox(this.positions);
      if(this.broadPhaseBoxPadding){
        vec3.sub(box[0], box[0], this.broadPhaseBoxPadding);
        vec3.add(box[1], box[1], this.broadPhaseBoxPadding);
      }
      return box;
    }

    get localAABBVerts(){
      return vertsFromAABB(this.localAABB)
    }

    get worldAABBVerts(){
      return this.localAABBVerts.map((localAABBVert) => {
        return vec3.transformMat4(
          [0,0,0],
          localAABBVert,
          this.model
        );
      })
    }

    get worldAABB(){
      return boundingBox(<[number,number,number][]>this.worldAABBVerts);
    }

    get AABBScale(){
      const localAABB = this.localAABB;
      return Math.max(
        localAABB[1][0],
        localAABB[1][1],
        localAABB[1][2]
      );
    }

    getCenterPointFromPosition(position: vec3): vec3{
      return [
        position[0],
        position[1] + (this.localAABB[1][0] / 2),
        position[2],
      ];
    }

    get centerPoint(){
      return this.getCenterPointFromPosition(<vec3>this.position);
    }

    get centerTop(){
      return [
        this.position[0],
        this.position[1] + this.localAABB[1][0],
        this.position[2],
      ];
    }

    get broadPhaseCollisions(){
      return Object
        .values(this.rootStore.entityStore.entityIndex)
        .filter((otherEntity: Entity & {worldAABB?: [vec3][]}) => {
          const notSelf = this.id !== otherEntity.id;
          const notSibling = this.rootParentId !== otherEntity.rootParentId;
          const notIgnored = this.broadPhaseIgnoreIDs.length ?
                             this.broadPhaseIgnoreIDs.indexOf(otherEntity.rootParentId) === -1 :
                             true

          // notSelf and notSibling maybe shouldn't be considered here
          // maybe there are cases where you'd want to know when
          // sibling collide?
          return notSelf &&
                 notSibling &&
                 notIgnored &&
                 otherEntity.worldAABB &&
                 AABBintersectAABB(this.worldAABB, otherEntity.worldAABB)
        })
    }

    get aabbRenderPayload(){
      return {
        model: mat4.create(),
        positions: this.worldAABBVerts,
        cells: [
          [ 0, 1, 2 ],
          [ 0, 2, 3 ],
          [ 6, 5, 4 ],
          [ 6, 4, 7 ],
          [ 1, 7, 4 ],
          [ 1, 4, 2 ],
          [ 0, 3, 5 ],
          [ 0, 5, 6 ],
          [ 0, 6, 7 ],
          [ 0, 7, 1 ],
          [ 2, 4, 5 ],
          [ 2, 5, 3 ]
        ],
        color: this.broadPhaseCollisions.length ? [0, 0.7, 0.2, 0.5] : [0.7,0,0.5, 0.5],
      }
    }
  }

  const Derived = BroadPhaseBox;
  return Derived as MergeCtor<typeof Derived, TBase>;
}
