import wrtc from '@koush/wrtc';
import http from 'http';
import socketIo, { Socket } from 'socket.io';
import NetworkBase from './NetworkBase';
import SimplePeer from 'simple-peer';
import RootStore from '../RootStore';

export default class ServerNetwork extends NetworkBase {
  rootStore: RootStore = null
  networkPeerSendWelcome({ id }: { id: string }) {
    //Tell the worker a new peer has joined to
    // initiate the welcome package
    console.log('sending welcom peer to worker...');
    this.dispatchProxy({
      type: "@SERVER/WELCOME/PEER",
      payload: {
        peerId: id,
      },
    });
  }

  init() {
    const server = http.createServer();
    const io = socketIo(server, {
      path: '/',
      serveClient: true,
      // below are engine.IO options
      pingInterval: 10000,
      pingTimeout: 5000,
      cookie: false
    });

    console.log("websockets on ", this.config.socketIO.host, this.config.socketIO.port);
    server.listen(this.config.socketIO.port, this.config.socketIO.host);

    io.on('connection', (socket: Socket & { destroy?: Function; protocol?: string }) => {
      const peerId = socket.handshake.query.id
      console.log("new websocket connection!:", peerId);
      socket.on(
        'data',
        this.peerDataHandler
      );
      socket.connected = true;
      //socket.send = function(payload){this.emit('data', payload)};
      socket.destroy = () => socket.disconnect(true);
      socket.on('disconnect', this.peerCloseHandler.bind(peerId));

      this.networkPeerCreate(
        peerId,
        'websocket',
        //@ts-ignore
        socket,
      );
      this.networkPeerSendWelcome({ id: peerId });
    });

    console.log("initalizeNetwork: hub url", this.config.signalHub.url);
    this.signalhub.subscribe('client_offer').on('data', (offer: any) => {
      // console.log('client_offer', offer);
      const offerPeer = this.peers[offer.id];
      if (offerPeer && offerPeer.connection) {
        try {
          //@ts-ignore
          offerPeer.connection.signal(offer.offer);
        } catch (ex) {
          console.log("tried to signal a peer ", offer.id);
          throw (ex);
        }
        return;
      }

      const peer = new SimplePeer({
        ...this.config.simplePeer,
        wrtc,
        initiator: false
      });
      peer.signal(offer.offer);

      peer.on('error', (err) => {
        try {
          peer.destroy();
        } catch (ex) {
          console.error('failed to destroy peer on error, ', offer.id);
        }
        console.log("peer error", err);
        this.networkPeerError({ offerId: offer.id });
      });

      peer.on('close', () => this.peerCloseHandler(offer.id));

      peer.on('signal', (signal) => {
        //console.log('peer signal', offer.id, signal.type, signal);
        this.signalhub.broadcast(`ack_${offer.id}`, signal);
      });

      peer.on('connect', () => {
        //Register this peer as connected.
        console.log('PEER has connected to server!!');
        this.networkPeerConnect(offer.id, 'webrtc');
        this.networkPeerSendWelcome({ id: offer.id });
      })

      peer.on('data', (data: any) => this.peerDataHandler(data));

      this.networkPeerCreate(
        offer.id,
        'webrtc',
        peer,
      );
    });
  }
}
