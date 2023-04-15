import Entity from './Entity';
import CollisionHull from './CollisionHull';
import BroadPhaseBox from './BroadPhaseBox';
import CubeGeometry from './CubeGeometry'


export default class Cube extends Entity.behaves(
  CollisionHull,
  BroadPhaseBox,
  CubeGeometry
){
  constructor(props:any){
    super(props);
  }
}
