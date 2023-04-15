import { parentPort } from 'worker_threads';
import { AbstractedWorkerAPI } from './interface';

const postMessage: AbstractedWorkerAPI['postMessage'] = function(message, transferList){
  parentPort.postMessage(message, transferList as any)
}

const addEventListener: AbstractedWorkerAPI['addEventListener'] = function(onMessage){
  if (!parentPort) {
    throw Error("Invariant violation: MessagePort to parent is not available.")
  }

  const messageHandler = (message: any) => {
    onMessage(message)
  }
  const unsubscribe = () => {
    parentPort.off("message", messageHandler)
  }

  parentPort.on('message', messageHandler);
  return unsubscribe;
}

export default {
  postMessage,
  addEventListener
}
