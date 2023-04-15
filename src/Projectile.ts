import { vec3, vec2 } from 'gl-matrix';
import { ConstrainedMixin } from './types/ConstrainedMixin';
import Entity from './Entity';

type ProjectileMixin = ConstrainedMixin<Entity>

interface IProjectileProps{
  direction: vec3,
}

export default function Projectile<TBase extends ProjectileMixin>(superclass: TBase) {
  return class Projectile extends(superclass as any){
    direction: vec3 = [0,0,0]
    hitPoints: vec2 = [0, 30*3]
    moveSpeed = 4
    decay = 1

    constructor(...args: any[]){
      super(...args);

      const props: IProjectileProps = args[0];
      if(props.direction) this.direction = props.direction;


      this.on('tick', () => {
        this.position = vec3.add(
          this.position,
          this.position,
          vec3.scale(
            [0,0,0],
            this.direction,
            this.moveSpeed
          )
        )
        this.hitPoints[0] += this.decay

        if(this.broadPhaseCollisions.length){
          this.broadPhaseCollisions.forEach((c: Entity) => c.emit('damage'));
          this.rootStore.entityStore.removeEntity(this.id);
        }

        //kill self LOL
        if(this.hitPoints[0] >= this.hitPoints[1]){
          this.rootStore.entityStore.removeEntity(this.id);
        }
      });
    }
  }
}
