import ServerNetwork from './network/ServerNetwork';
import pako from 'pako';
import { Worker } from "worker_threads";

let worker: any = null;
let network: ServerNetwork = null;

function workerWrap(action: any){
  worker.postMessage(action);
}

async function main(){
  network = new ServerNetwork(workerWrap);
  network.init();

  //@ts-ignore
  worker = new Worker(new URL('./server.worker', import.meta.url));
  console.log("Server Simulation Started...");

  worker.on('message', (messageEvent: any) => {
    if(messageEvent?.constructor.name === 'Uint8Array'){
      // if payloads are already encoded as buffer
      // we assume we can send them over the wire
      network.broadcastActionToPeers(messageEvent);
    }else if(messageEvent?.peerTarget){
      network.broadCastActionToPeer(
        messageEvent?.peerTarget,
        pako.deflate(messageEvent?.action),
        messageEvent?.peerStatus
      );
    }else if(messageEvent?.type === "@SERVER/PEER/ONLINE"){
      network.peers[messageEvent.payload.peerId].status = 'online';
    }else if(messageEvent?.type === "@SERVER/PEER/DISCONNECT"){
      network.peers[messageEvent.payload.peerId].status = 'offline';
      network.peers[messageEvent.payload.peerId].connection.destroy();
      network.peers[messageEvent.payload.peerId] = null;
      delete network.peers[messageEvent.payload.peerId]
    }else{
      console.warn('unknown messageEvent from worker', messageEvent);
    }
  });
}
main();
