import NetworkBase from './NetworkBase';
import * as SimplePeer from 'simple-peer';

export default class ClientNetwork extends NetworkBase {
  init(){
    const id = this.uuid;
    const wrtcConfig = this.config.simplePeer;
    let {peer, protocol} = this.getNewPeer(id, wrtcConfig);
    this.networkPeerCreate(
      id,
      protocol,
      peer,
    );

    if(protocol === 'webrtc'){
      this.signalhub.subscribe(`ack_${id}`).on('data', (
        signal: SimplePeer.SignalData
      ) => {
        console.log("signalhub.on'data' ", `server_${id}_ack`, signal);
        try{
          //@ts-ignore
          peer.signal(signal);
        }catch(ex){
          console.error(ex);
          console.log(peer);
        }
      });

      // This some times does not get triggered by clients?
      // seein it on iOS 12
      //@ts-ignore
      peer.on('signal', (data) => {
        this.signalhub.broadcast('client_offer', {
          id,
          offer:data
        });
      });

      //@ts-ignore
      peer.on('connect', () => this.networkPeerConnect(
        id,
        protocol,
        'online'
      ));
      peer.on('close', () => this.networkPeerClose());
      peer.on('error', () => this.networkPeerError({offerId: id,}));
      peer.on('data', (data) => this.peerDataHandler(data));
    }
  }

  destroy(){
    this.peers[this.uuid].connection.destroy();
    this.peers[this.uuid] = null;
    delete this.peers[this.uuid];
  }

  networkPeerClose(){
    this.dispatchProxy({
      type:"@CLIENT/NETWORK/CLOSE",
    })
  }
}
