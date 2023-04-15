import BasePlayer from './BasePlayer';
import NetworkReplicated from './NetworkReplicated';

export default class RemotePlayer extends NetworkReplicated(BasePlayer){}
