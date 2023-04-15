import EllipsoidGeometry from './EllipsoidGeometry';
import EllipsoidTriCollideBehavior from './EllipsoidTriCollide';
import PlayerVelocity from './PlayerVelocity'
import CollisionHull from './CollisionHull'
import Geometry from './Geometry';
import Animate from './Animate';
import AssetDependent from './AssetDependency';
import Renderable from './Renderable';
import BroadPhaseBox from './BroadPhaseBox';
import Projectile from './Projectile'
import NetworkReplicated from './NetworkReplicated'

const behaviorIndex = {
  Animate,
  AssetDependent,
  BroadPhaseBox,
  CollisionHull,
  EllipsoidGeometry,
  EllipsoidTriCollideBehavior,
  Geometry,
  Renderable,
  Projectile,
  PlayerVelocity,
  NetworkReplicated
}

export default behaviorIndex;
