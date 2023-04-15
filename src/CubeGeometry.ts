import { ConstrainedMixin } from './types/ConstrainedMixin';
import Geometry from './Geometry'
import Entity from './Entity'
import makeCube from 'primitive-cube';

type GeometryDependencies = ConstrainedMixin<Entity>;

export default function CubeGeometry<TBase extends GeometryDependencies>(superclass: TBase){
  return class CubeGeometry extends Geometry(superclass) {
    constructor(props: any){
      super(props)
      Object.assign(this, makeCube.apply(this, props.cubeDimensions))
    }
  }
}
