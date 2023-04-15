import { mat4, vec3 } from 'gl-matrix'
import Entity from './Entity';
import Geometry from './Geometry'
import Renderable from './Renderable';
import BroadPhaseBox from './BroadPhaseBox';
import AssetDependent from './AssetDependency'
import CollisionHull from './CollisionHull';

import { IEntityProps } from './Entity'
interface IStaticVoxelMeshProps extends IEntityProps{
  alignMeshToCenterOrigin?: boolean
  assetFiles?: string[]
}

export default class StaticVoxelMesh
extends Entity.behaves(
  Renderable,
  CollisionHull,
  BroadPhaseBox,
  AssetDependent,
  Geometry,
){
  constructor(props: IStaticVoxelMeshProps){
    super(props);

    if(props.alignMeshToCenterOrigin){
      const centerOffset = mat4.fromTranslation(
        mat4.create(),
        [
          -Math.floor((this.assetAABB[1][0] / 2)),
          0, //don't recenter on the Y axis
          -Math.floor((this.assetAABB[1][2] / 2))
        ]
      );

      this.positions.map((p: vec3) => {
        return vec3.transformMat4(p, p, centerOffset);
      })

    }
  }
}
