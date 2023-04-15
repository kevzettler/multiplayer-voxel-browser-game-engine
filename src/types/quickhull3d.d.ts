declare module 'quickhull3d'{
  import { vec3 } from 'gl-matrix';

  interface hullOpts {
    skipTriangulation?: boolean
  }

  export default function(
    points: vec3[],
    options?: hullOpts
  ): vec3[]
}
