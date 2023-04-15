import { action, observable, makeObservable } from 'mobx';
import config from './config';
import SimplePeer from 'simple-peer';
import * as io from 'socket.io-client';
import pako from 'pako';
import * as kiwi from 'kiwi-schema';
import { v1 as uuidv1 } from 'uuid';
import signalHub from 'signalhub';
import actionsKiwi from './action.kiwi';

const actionSchema = kiwi.compileSchema(actionsKiwi);

type SocketInstance = typeof io;

interface IWebRTCPeer extends SimplePeer.Instance {
  status?: string
  systemId?: string
  connected?: boolean
}

interface ISocketPeer extends SocketInstance {
  status?: string
  systemId?: string
  connected?: boolean
  send(payload: any): void
  on(event: string): void
  destroy(): void
}

type IPeer = IWebRTCPeer | ISocketPeer;


interface IPeerRecord {
  status: string
  protocol?: string
  systemId?: string
  connection: IPeer
}
interface IPeerIndex {
  [index: string]: IPeerRecord
}


export default class NetworkBase {
  uuid = uuidv1()
  peers: IPeerIndex = {};

  dispatchProxy: Function = null
  signalhub: any = null //TODO should be complex signal hub type
  config: any = null //TODO should be complex network config type

  constructor(dispatchProxy: Function) {
    makeObservable(this, {
      peers: observable,
      networkPeerCreate: action,
      networkPeerConnect: action,
      networkPeerClose: action,
      networkPeerError: action,
      peerCloseHandler: action
    });

    this.dispatchProxy = dispatchProxy
    this.signalhub = signalHub('multiplayer-voxel-browser-engine', [
      config.signalHub.url
    ]);
    this.config = config;
  }

  networkPeerCreate(id: string, protocol: string, peer: IPeer) {
    this.peers[id] = {
      status: 'init',
      protocol,
      connection: peer,
    };
  }

  networkPeerConnect(id: string, protocol: string, status = "sync") {
    this.peers[id].status = status;
    this.peers[id].protocol = protocol;
  }

  networkPeerClose(peerId: string) {
    this.peers[peerId] = null;
    delete this.peers[peerId];
    this.dispatchProxy({
      type: "@SERVER/PEER/DISCONNECT",
      entityId: peerId
    });
  }

  networkPeerError({ offerId }: { offerId: string }) {
    if (this.peers[offerId]) {
      this.peers[offerId].status = 'error';
      this.networkPeerClose(offerId);
    } else {
      console.error(`tried to set error status on missing peer ${offerId}`);
    }
  }

  peerCloseHandler(peerId: string) {
    console.log('peerCloseHandler, close connection:', peerId);
    const peerToClose = this.peers[peerId];
    try {
      peerToClose.connection.destroy();
    } catch (ex) {
      console.error(`peer.close called and failed to detroy local peer connection for peer ${peerId}`);
    }
    this.networkPeerClose(peerId);
  }

  // returns a 'peer'
  // webrtc connection if available else, socket.io
  getNewPeer(
    id: string,
    options: SimplePeer.Options
  ): { peer: IPeer, protocol: string } {
    let peer: any = null;
    let protocol = '';
    try {
      peer = new SimplePeer({
        ...options,
        initiator: true
      });
      protocol = 'webrtc';
    } catch (ex) {
      console.error("WebRTC not supported falling back to websockets \n", ex);
      peer = io(config.socketIO.url, {
        query: { id }
      });
      protocol = 'websocket';
      peer.connected = true;
      peer.destroy = function () {
        this.close();
      };
      peer.send = function (payload: any) {
        this.emit('data', payload);
      };
      peer.on('data', this.peerDataHandler);
    }

    return { peer, protocol };
  }

  encodeAndCompressActionForNetwork(
    action: any,
    sourceId?: string
  ) {
    try {
      let encodedAction = null;
      // actions may already be encoded because of
      // the worker-thread postMessage barrier
      if (action.constructor.name === 'Uint8Array') {
        encodedAction = action;
      } else {
        encodedAction = actionSchema.encodeAction({
          systemId: sourceId ? sourceId : this.uuid,
          ...action,
        });
      }

      return pako.deflate(encodedAction);
    } catch (ex) {
      console.error('failed to prepare Action for network transport', action);
      console.error(ex);
    }
  }

  broadCastActionToPeer(
    peerId: string,
    compressedAction: Uint8Array,
    peerStatus = "online"
  ) {
    const peer = this.peers[peerId];

    if (peerStatus && peer.status !== peerStatus) return false;
    if (peer.systemId === this.uuid) return false; // don't send to self
    if (peer.connection && peer.connection.connected) {
      try {
        peer.connection.send(compressedAction);
      } catch (ex) {
        console.error('tried to call send on non valid peer', peer);
      }
    }
  }

  broadcastActionToPeers(
    action: any,
    peerStatus = "online"
  ) {
    const peers = this.peers;
    if (!peers || !Object.values(peers).length) return;

    const actionCompressedForNetwork = this.encodeAndCompressActionForNetwork(
      action,
    );

    // If there is explicity peerId set
    /* if(action.peerId){
     *   if(action.type === "@NETWORK/server/register/peer"){
     *     console.log('** network broadcasting peer sync');
     *   }
     *   return this.broadCastActionToPeer(action.peerId, actionCompressedForNetwork, peerStatus);
     * } */

    Object.keys(peers).forEach((peerId: string) =>
      this.broadCastActionToPeer(peerId, actionCompressedForNetwork, peerStatus)
    )
  }

  peerDataHandler(data: Buffer) {
    let remoteActionBuffer: Uint8Array = null;
    try {
      remoteActionBuffer = pako.inflate(data);
    } catch (ex) {
      throw ex;
    }

    let remoteAction: { type: string; payload: any } = null;
    try {
      remoteAction = actionSchema.decodeAction(remoteActionBuffer);
    } catch (ex) {
      throw ex;
    }

    if (remoteAction) {
      this.dispatchProxy(remoteAction);
    }
  };
}
