import { vec2, vec3 } from 'gl-matrix';
import { observe, observable, makeObservable } from 'mobx';
import boundingBox from 'vertices-bounding-box';
import { ConstrainedMixin } from './types/ConstrainedMixin';
import Entity from './Entity';

type GeometryMixin = ConstrainedMixin<Entity>;

// This is a simplical complex
// possibly reused else where
export interface IGeometry{
  positions: vec3[];
  cells: vec3[];
  tris: vec3[][];
  normals: vec3[];
}

export default function Geometry<TBase extends GeometryMixin>(superclass: TBase){
  class Geometry extends superclass implements IGeometry {
    positions: vec3[] = [];
    cells: vec3[] = [];
    tris: vec3[][] = [] // an array of 3 verts [[[][][]], [[][][]]] used for collision detection
    normals: vec3[] = []
    uvs: vec2[] = []
    geometryOffset: vec3 = [0,0,0]

    constructor(...args: any[]){
      super(args[0]);

      makeObservable(this, {
        positions: observable,
        cells: observable
      });

      const props = args[0];

      if(props.positions) this.positions = props.positions;
      if(props.normals) this.normals = props.normals;
      if(props.cells) this.cells = props.cells;
      if(props.uvs) this.uvs = props.uvs;

      observe(this, 'positions', () => {
        this.tris = this.cells.map((triangleVertIndex: vec3): vec3[] => {
          return [
            this.positions[triangleVertIndex[0]],
            this.positions[triangleVertIndex[1]],
            this.positions[triangleVertIndex[2]],
          ]
        });
      });
    }

    get boundingBox(){
      if(!this.positions.length) debugger;
      return boundingBox(this.positions)
    }
  }

  // TS1206 decorators not valid on class expressions need to return after definition
  // https://github.com/microsoft/TypeScript/issues/14607#issuecomment-285935927
  //
  return Geometry;
}
