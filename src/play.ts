import "./play.css";

import { touchControls, desktopControls } from './Input';
import ClientNetwork from './network/ClientNetwork';
import { v1 as uuidv1 } from 'uuid';
import { fetchLocalStoragePlayerData } from './util/localStorage'

const clientId = uuidv1();

const canvas = document.createElement('canvas');
canvas.id = 'gameplay-canvas';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight
canvas.style.width = '100%';
canvas.style.height = '100%';
document.body.appendChild(canvas);

const offscreen = canvas.transferControlToOffscreen();

const worker: Worker = new Worker(new URL('./browser.worker', import.meta.url));
const network: ClientNetwork = new ClientNetwork(workerWrap);
network.uuid = clientId;

// Disconnect from network on window reload and refresh
window.onbeforeunload = function() {
  console.log("window unload!");
  network.destroy();
};

worker.addEventListener('message', (messageEvent: any) => {
  console.log('worker message', messageEvent);
  if(
    messageEvent.data.constructor.name === 'Uint8Array' ||
    (messageEvent.data &&
     messageEvent.data.type &&
     messageEvent.data.type.match(/@NETWORK/))
  ){
    if(messageEvent.data && messageEvent.data.type && messageEvent.data.type.match(/INIT/)){
      network.init();
    }else{
      network.broadcastActionToPeers(messageEvent.data);
    }
  }else{
    console.warn('unknown messageEvent from worker', messageEvent);
  }
});

//
// You can not pass around a reference to worker.postMessage
// it will throw an illegal operation.
// you can pass around this wrapper function
//
function workerWrap(action: any){
  worker.postMessage(action);
}

function inputDispatch(action: any){
  // send inputs to simulation
  // and server
  worker.postMessage(action);
  network.broadcastActionToPeers(action);
}

if('ontouchstart' in window || navigator.maxTouchPoints){
  touchControls(document, inputDispatch);
}else{
  desktopControls(document, inputDispatch);
}

worker.postMessage(
  {
    type: "@RENDER/INIT",
    payload: {
      canvas:  offscreen,
      width: window.innerWidth,
      height: window.innerHeight,
      player: fetchLocalStoragePlayerData(),
      clientId,
    }
  },
  [offscreen]
);

window.onresize = function windowResizeHandler(){
  worker.postMessage({
    type: "@RENDER/RESIZE",
    payload: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  });
}

window.onorientationchange = function windowResizeHandler(){
  worker.postMessage({
    type: "@RENDER/RESIZE",
    payload: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  });
}

//network.init();
