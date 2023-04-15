import { vec3 } from 'gl-matrix';
import BasePlayer, { IPlayerProps } from './BasePlayer';
import NetworkReplicated from './NetworkReplicated';

export default class AIPlayer
extends NetworkReplicated(BasePlayer) {
  lastPosition: vec3 = vec3.create()

  constructor(props: IPlayerProps){
    super(props);

    // really dumb AI for the baddie
    this.moveAxisDirection = [1,1];
    this.emit('movePress');

    this.on('tick', () => {
      if(vec3.distance(this.position, this.lastPosition) <= 0){
        const axisIndex = Math.floor(Math.random() * 2);
        this.moveAxisDirection[axisIndex] *= -1;
      }

      if(this.position[2] >= 200){
        this.moveAxisDirection[0] = 1;
      }
      if(this.position[2] <= -200){
        this.moveAxisDirection[0] = -1;
      }
      if(this.position[0] >= 450){
        this.moveAxisDirection[1] = -1;
      }
      if(this.position[0] <= -450){
        this.moveAxisDirection[1] = 1;
      }

      vec3.copy(this.lastPosition, this.position);
    });
  }
}
