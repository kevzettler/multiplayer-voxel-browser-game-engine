import { v1 as uuidv1 } from 'uuid';
import Loop from 'fixed-game-loop';
import AssetStore from './AssetStore';
import EntityStore from './EntityStore';
import RenderStore from './RenderStore';
import ClientNetwork from './network/ClientNetwork';

interface IAction {
  type: string
  payload: any
  systemId?: string
}

export interface IActionMap{
  ['@ENTITIES/REMOVE']?: (rootStore: RootStore, action: any) => void
  [index: string]: (rootStore: RootStore, action: IAction) => void
}

export interface IStoreProps{
  actionMap: IActionMap
  debug?: debugOpts
}

interface debugOpts{
  collisions?: boolean
  drawHulls?: boolean
  debugCamera?: boolean
  dispatchLog?: (actionType:string) => boolean
  render?: boolean
  network?: boolean
}

export default class RootStore {
  uuid = uuidv1()
  role = 'store'
  assetPath = `/assets`
  actionMap: IActionMap = {} // TODO default actions
  tick = 0
  debug: debugOpts = {}
  loop: Loop = null
  time: {
    dt: number,
    elapsed: number,
    tickCount: number,
    curTime: number,
  } = null

  worldUP = [0,1,0]
  worldDown = [0,-1,0]

  assetStore: AssetStore = null
  entityStore: EntityStore = null
  renderStore: RenderStore = null
  networkStore: ClientNetwork = null

  constructor(props: IStoreProps){
    Object.assign(this, props);
  }

  startLoop(){
    if(!this.loop) throw new Error('startLoop, missing Loop on RootState');
    this.loop.start();
  }

  async dispatch(action: IAction){
    if(!action.systemId) action.systemId = this.uuid;

    if(!this.actionMap[action.type]){
      console.warn(`Unidentified action type passed to root dispatch ${JSON.stringify(action)}`);
    }else{
      if(this.debug?.dispatchLog &&
         typeof action.type === 'string' &&
         this.debug.dispatchLog(action.type)) console.log(action.type, JSON.stringify(action));

      // this needs to be awaited or causes weird behavior
      await this.actionMap[action.type](this, action);
    }
  }
}
