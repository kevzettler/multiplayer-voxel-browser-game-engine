import 'es6-promise/auto';
import * as flatMap from 'array.prototype.flatmap';
import { glMatrix } from 'gl-matrix';
import Loop from 'fixed-game-loop';
import * as kiwi from 'kiwi-schema';
import parentPort from './Worker'


import RootStore, { IStoreProps } from './RootStore';
import Scene from './scene';
import AssetStore from './AssetStore';
import EntityStore from './EntityStore';
import actionsKiwi from './network/action.kiwi';
import actionMap from './actionMap';

const actionSchema = kiwi.compileSchema(actionsKiwi);
flatMap.shim();

// Use Arrays for glmatrix constructors
//This must be set for collision to work
glMatrix.setMatrixArrayType(Array);

const ASSET_HOST = process.env.ASSET_HOST;
const ASSET_PORT = process.env.ASSET_PORT;

const HOST_ROOT = `http://${ASSET_HOST}:${ASSET_PORT}`

class ServerStore extends RootStore {
  uuid = 'game-server'
  role = 'server'
  assetPath = `${HOST_ROOT}/assets`

  worldUP = [0, 1, 0]
  worldDown = [0, -1, 0]

  assetStore: AssetStore = null
  entityStore: EntityStore = null

  constructor(props?: IStoreProps) {
    super(props);
    this.assetStore = new AssetStore(this);
    this.entityStore = new EntityStore(this);

    // 100ms tick
    // 60 fps * 1 = 1000 = 1 sec / 10 = 100ms
    const clientBroadCastRate = (60 * 1) / 10; //60fps=1sec * 5
    let clientBroadcastTimer = 0;
    this.loop = new Loop({
      update: (dt: number, elapsed: number, tickCount: number) => {
        this.entityStore.updateEntities(dt, elapsed, tickCount);
        this.time = { dt, elapsed, tickCount, curTime: this.loop._curTime };
        //        console.log(tickCount, this.loop._curTime);
      },

      //Server dosen't actually render it broadcasts to clients
      render: () => {
        if (!this.time) return;
        clientBroadcastTimer++;
        if (clientBroadcastTimer >= clientBroadCastRate) {
          parentPort.postMessage(actionSchema.encodeAction({
            type: "@NETWORK/server/tick",
            // TODO KZ worker_threads needs simple objects and cant take MOBX objects
            // needs to be strringified or serialized before sending
            payload: {
              time: this.time,
              entities: this.entityStore.networkReplicatedEntities,
            }
          }), null);
          clientBroadcastTimer = 0;
        }
        // console.log(this?.time?.dt, this?.time?.tickCount);
      },

      autoStart: false
    });
    Object.assign(this, props);
  }
}

declare global {
  namespace NodeJS {
    interface Global {
      rootState: RootStore
    }
  }
}

async function main() {
  const rootState = new ServerStore({
    debug: {
      dispatchLog: (actionType: string) => {
        if (actionType.match(/tick/)) return false;
        if (actionType.match(/LOOK/)) return false;
        return true;
      }
    },
    actionMap
  });
  global.rootState = rootState;
  await Scene(rootState);
  rootState.startLoop();
  console.log("Server Simulation Started...");
  console.log(`access at ${HOST_ROOT}`);

  parentPort.addEventListener((event: any) => {
    if (event && event.type) {
      rootState.dispatch(event);
    } else {
      console.warn('unsure what to do with message passed to worker...', event);
    }
  });
}
main();
