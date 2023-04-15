declare module 'primitive-ellipsoid'{
  import { ISimplicalComplex } from 'math';

  interface options{
    latSegments: number,
    lngSegments: number,
    rx: number,
    ry: number,
    rz: number
  }

  export default function(radius: number, options: options): ISimplicalComplex
}
