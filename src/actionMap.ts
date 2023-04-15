import * as kiwi from 'kiwi-schema';
import { vec3 } from 'gl-matrix';
import ClientStore from './ClientStore';
import RootStore from './RootStore';
import LocalPlayer from './LocalPlayer';
import RemotePlayer from './RemotePlayer';
import { getAssetListFromItems } from './AssetDependency';
import Scene from './scene';
import actionsKiwi from './network/action.kiwi';
import parentPort from './Worker'

const actionSchema = kiwi.compileSchema(actionsKiwi);

type Store = ClientStore | RootStore;

const actionMap = {
  '@RENDER/RESIZE': (
    rootStore: Store,
    action: {payload: {height: number, width: number}}
  ) => {
    const { width, height } = action.payload;
    rootStore.renderStore.resize(width, height);
  },

  '@RENDER/INIT': async (
    rootStore: Store,
    action: {payload: {
      clientId: string
      canvas: HTMLCanvasElement
      width: number
      height: number
      player: any
    }}) => {
      rootStore.uuid = action.payload.clientId;
      rootStore.renderStore.init(
        action.payload.canvas,
        action.payload.width,
        action.payload.height
      );

      const playerPayload = {
        ...action.payload.player,
        id: rootStore.uuid,
      }

      const playerId = playerPayload.id ? playerPayload.id : `${rootStore.uuid}`;
      const userName = playerPayload.userName ? playerPayload.userName : `${rootStore.uuid}`
      const playerAssets = getAssetListFromItems(playerPayload.items);
      await rootStore.assetStore.fetchList(playerAssets);

      new LocalPlayer({
        rootStore,
        id: playerId,
        userName,
        position: [0, 0, -100],
        rotation: [0,0,0,1],
        collider: true,
        gunRate: [0, 30],
        broadPhaseBoxPadding: [15, 9, 15],
        color: [0,1,1,0.8],
        assetFiles: playerAssets,
        palette: playerPayload.palette,
        items: playerPayload.items
      });

      //await Scene(rootStore);
      //rootStore.debug = {collisions: true};
      rootStore.startLoop();

      parentPort.postMessage({
        type: "@NETWORK/INIT"
      }, null)
    },

  "@SERVER/PEER/DISCONNECT": (rootStore: Store, action:any) => {
    if(action.entityId === rootStore.uuid){
      console.error('SERVER/PEER/DISCONNECT disconnect event for self???')
    }
    rootStore.entityStore.removeEntity(action.entityId);
  },

  "@INPUT/MOVE-FORWARD/PRESS": (rootStore:Store, action:any) => {
    rootStore.entityStore.entityIndex[action.systemId].emit('movePress', 0,1);
  },

  "@INPUT/MOVE-FORWARD/UP": (rootStore:Store, action:any) => {
    rootStore.entityStore.entityIndex[action.systemId].emit("moveRelease", 0,0)
  },
  "@INPUT/MOVE-BACK/PRESS": (rootStore:Store, action:any) => {
    rootStore.entityStore.entityIndex[action.systemId].emit("movePress", 0, -1)
  },
  "@INPUT/MOVE-BACK/UP": (rootStore:Store, action:any) => {
    rootStore.entityStore.entityIndex[action.systemId].emit("moveRelease", 0,0)
  },

  "@INPUT/MOVE-LEFT/PRESS": (rootStore:Store, action:any) => {
    rootStore.entityStore.entityIndex[action.systemId].emit("movePress", 1,-1)
  },
  "@INPUT/MOVE-LEFT/UP": (rootStore:Store, action:any) => {
    rootStore.entityStore.entityIndex[action.systemId].emit("moveRelease", 1,0)
  },

  "@INPUT/MOVE-RIGHT/PRESS": (rootStore:Store, action:any) => {
    rootStore.entityStore.entityIndex[action.systemId].emit("movePress", 1,1)
  },
  "@INPUT/MOVE-RIGHT/UP": (rootStore:Store, action:any) => {
    rootStore.entityStore.entityIndex[action.systemId].emit("moveRelease", 1,0)
  },
  "@INPUT/JUMP/PRESS": (rootStore:Store, action:any) => {
    rootStore.entityStore.entityIndex[action.systemId].emit("jump", 1);
  },

  "@INPUT/JUMP/UP": (rootStore:Store, action:any) => {
    rootStore.entityStore.entityIndex[action.systemId].emit("releaseJump", 1);
  },

  "@INPUT/LOOK": (rootStore:Store, action:any) => {
    if(rootStore.entityStore.entityIndex[action.systemId]){
      rootStore.entityStore.entityIndex[action.systemId].setLookAxisDirection(action.payload);
    }else{
      console.warn("@INPUT/LOOKf local player not ready for input");
    }
  },

  '@INPUT/PRIMARY_TRIGGER': (rootStore:Store, action:any) => {
    rootStore.entityStore.entityIndex[action.systemId].emit('primaryTrigger');
  },

  '@INPUT/PRIMARY_RELEASE': (rootStore:Store, action:any) => {
    rootStore.entityStore.entityIndex[action.systemId].emit('primaryRelease');
  },

  "@SERVER/PLAYER/JOIN": async (rootStore:Store, action:any) => {
    console.log("network/player/join");
    const playerPayload = {
      ...action.payload.player,
      id: action.systemId,
    }

    const playerAssets = getAssetListFromItems(playerPayload.items);
    await rootStore.assetStore.fetchList(playerAssets);

    const newPlayer = new RemotePlayer({
      rootStore,
      ...playerPayload,
      position: [0, 0, -100],
      rotation: [0,0,0,1],
      assetFiles: playerAssets,
    });

    // Ensure player dosen't overlap with some other entity
    if(newPlayer.broadPhaseCollisions && newPlayer.broadPhaseCollisions.length){
      while(newPlayer.broadPhaseCollisions.length){
        vec3.add(newPlayer.position, newPlayer.position, [10, 0, -10])
      }
    }

    parentPort.postMessage({
      type: "@SERVER/PEER/ONLINE",
      payload: {
        peerId: action.systemId,
      }
    }, null)
  },

  "@SERVER/WELCOME/PEER": (
    rootStore: Store,
    action:{
      type: string, payload:{peerId: string}
    }) => {

      const welcomePackage = Object.keys(
        rootStore.assetStore.loadedAssets
      );

      // Send a compressed message back to the peer
      console.log('send welcome package to peer');
      parentPort.postMessage({
        peerTarget: action.payload.peerId,
        peerStatus: 'sync',
        action: actionSchema.encodeAction({
          type: "@CLIENT/WELCOME/SYNC",
          systemId: rootStore.uuid,
          payload: {
            time: rootStore.time,
            assetIds: welcomePackage,
            entities: rootStore.entityStore.rootEntities,
          },
        })
      }, null);
    },

  '@CLIENT/WELCOME/SYNC': async (
    rootStore: ClientStore,
    action: {type: string, payload: any}
  ) => {
    await rootStore.assetStore.fetchList(action.payload.assetIds);

    await rootStore.entityStore.processServerEntities(
      action.payload.time,
      action.payload.entities
    );

    rootStore.loop.pause();

    //reset the loop
    rootStore.loop._elapsed = action.payload.time.elapsed;
    rootStore.loop._tickCount = action.payload.time.tickCount;

    console.log('@CLIENT/WELCOME/SYNC send player join event to server');
    parentPort.postMessage(actionSchema.encodeAction({
      type: "@SERVER/PLAYER/JOIN",
      systemId: rootStore.uuid,
      payload: {
        player: {
          ...rootStore.entityStore.localPlayer
        },
      },
    }), null);

    rootStore.loop.resume();
  },

  '@NETWORK/server/tick': async(
    rootStore: Store,
    action: any
  ) => {
    if(rootStore.loop._tickCount >= action.payload.time.tickCount + 10){
      console.error(
        'Client Tick has out paced server tick???',
        rootStore.loop._tickCount,
        action.payload.time.tickCount,
        rootStore.loop._tickCount - action.payload.time.tickCount
      );
    }

    /* if(rootStore.loop._curTime < action.payload.time.curTime){
     *   console.error('Client time is behind server time? server should be old snap');
     * } */

    rootStore.entityStore.syncServerEntities(
      action.payload.time,
      action.payload.entities
    )

    //reset local time to server time?
    //rootStore.loop._curTime = action.payload.time.curTime
    rootStore.loop._tickCount = action.payload.time.tickCount
    rootStore.loop._elapsed = action.payload.time.elapsed
  },
}

export default actionMap;
