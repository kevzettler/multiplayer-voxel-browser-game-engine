import Loop from 'fixed-game-loop';
import RootStore, {IStoreProps} from './RootStore';
import AssetStore from './AssetStore';
import EntityStore from './EntityStore';
import RenderStore from './RenderStore';

export default class ClientStore extends RootStore {
  role = 'client'
  //    isMobile = (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1)
  assetPath = `/assets`

  worldUP = [0,1,0]
  worldDown = [0,-1,0]

  assetStore: AssetStore = null
  entityStore: EntityStore = null
  renderStore: RenderStore = null

  loop: Loop = null

  constructor(props: IStoreProps){
    super(props);
    this.assetStore = new AssetStore(this);
    this.entityStore = new EntityStore(this);
    this.renderStore = new RenderStore(this);

    this.loop = new Loop({
      update: this.rootUpdate.bind(this),
      render: this.renderStore.render.bind(this.renderStore),
      autoStart: false,
    });
    Object.assign(this, props);
  }

  rootUpdate(dt: number, elapsed: number, tickCount: number){
    //    console.log('tick:: ', dt, elapsed, tickCount);
    // TODO extract to action map..
    this.entityStore.updateEntities(dt,elapsed,tickCount);
    this.renderStore.camera.updateCamera();
  }
}
