import BasePlayer from './BasePlayer';
import NetworkRollback from './NetworkRollback';

export default class LocalPlayer extends NetworkRollback(BasePlayer){}
