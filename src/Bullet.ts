import Geometry from "./Geometry";
import Entity from './Entity';
import NetworkReplicated from './NetworkReplicated';
import Projectile from './Projectile'
import BroadPhaseBox from './BroadPhaseBox'
import createEllipsoid from 'primitive-ellipsoid';

export default class Bullet extends Entity.behaves(
  NetworkReplicated,
  Projectile,
  BroadPhaseBox,
  Geometry
){
  constructor(...args: any[]){
    super(...args);
    // generate geometry and assign
    // this is localized to the entity constructor
    // because we don't want to trasfer the geometry payload over the wire

    const geometry = createEllipsoid(1, {
      latSegments: 6,
      lngSegments: 6,
      rx: 5,
      ry: 5,
      rz: 5,
    });

    Object.assign(this, geometry)
  }
}
