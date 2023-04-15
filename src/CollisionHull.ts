import { autorun, observe, computed, makeObservable } from 'mobx';
import { vec3 } from 'gl-matrix';
import quickHull from 'quickhull3d';
import { ConstrainedMixin } from './types/ConstrainedMixin';
import Entity from './Entity';
import { IGeometry}  from './Geometry';

type CollisionHullMixin = ConstrainedMixin<Entity & IGeometry>;

export interface ICollisionHull extends IGeometry{
  collisionTriangles: vec3[][]
}

interface IHull{
  positions: vec3[]
  cells: vec3[]
  tris: vec3[][]
}

export default function CollisionHull<TBase extends CollisionHullMixin>(superclass: TBase){
  class CollisionHull extends superclass implements ICollisionHull{
    hull: IHull = {
      positions: [],
      cells: [],
      tris: []
    }
    constructor(...args: any[]){
      super(args[0]);

      makeObservable(this, {
        collisionTriangles: computed({keepAlive: true})
      });

      autorun(() => {
        let tempFaces: vec3[] = null
        tempFaces = quickHull(this.positions);

        const hullTris: vec3[][] = [];
        const hullVerts: vec3[] = [];
        for(var f=0; f<tempFaces.length; f++){
          hullVerts.push(this.positions[tempFaces[f][0]]);
          hullVerts.push(this.positions[tempFaces[f][1]]);
          hullVerts.push(this.positions[tempFaces[f][2]]);


          hullTris.push([
            this.positions[tempFaces[f][0]],
            this.positions[tempFaces[f][1]],
            this.positions[tempFaces[f][2]]
          ])
        }

        const hullFaces = quickHull(hullVerts);

        this.hull =  {
          positions: hullVerts,
          cells: hullFaces,
          tris: hullTris,
        }
      });
    }

    get collisionTriangles(): vec3[][] {
      let tris = this.hull.tris;

      const worldTris = [];
      for(var t=0; t<tris.length; t++){
        worldTris.push([]);
        for(var v=0; v<3; v++){
          worldTris[t].push(
            vec3.transformMat4(
              [0,0,0],
              tris[t][v],
              this.model
            )
          )
        }
      }

      return worldTris;
    }

  }

  return CollisionHull;
}
