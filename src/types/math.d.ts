declare module 'math' {
  import { vec3, vec2 } from 'gl-matrix';
  export interface ISimplicalComplex{
    cells: vec3[],
    positions: vec3[],
    normals: vec3[],
    uvs: vec2[]
  }
}
