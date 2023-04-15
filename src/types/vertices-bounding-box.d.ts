declare module 'vertices-bounding-box' {
  import { vec3 } from 'gl-matrix';
  export default function boundingBox(
    positions: vec3[]
  ): [vec3, vec3]
}
