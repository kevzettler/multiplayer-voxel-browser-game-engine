import { AbstractedWorkerAPI } from './interface';

interface WorkerGlobalScope {
  addEventListener(eventName: string, listener: (event: Event) => void): void
  postMessage(message: any, transferables?: any[]): void
  removeEventListener(eventName: string, listener: (event: Event) => void): void
}

declare const self: WorkerGlobalScope

const postMessage: AbstractedWorkerAPI["postMessage"] = function postMessageToMaster(data, transferList?) {
  self.postMessage(data, transferList)
}

const addEventListener: AbstractedWorkerAPI["addEventListener"] = function subscribeToMasterMessages(onMessage) {
  const messageHandler = (messageEvent: MessageEvent) => {
    onMessage(messageEvent.data)
  }
  const unsubscribe = () => {
    self.removeEventListener("message", messageHandler as EventListener)
  }
  self.addEventListener("message", messageHandler as EventListener)
  return unsubscribe
}

export default {
  postMessage,
  addEventListener
}
