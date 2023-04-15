type UnsubscribeFn = () => void

export interface AbstractedWorkerAPI {
  isWorkerRuntime(): boolean
  postMessage(message: any, transferList?: Transferable[]): void
  addEventListener(onMessage: (data: any) => void): UnsubscribeFn
}

export type WorkerFunction = ((...args: any[]) => any) | (() => any)

export type WorkerModule<Keys extends string> = {
  [key in Keys]: WorkerFunction
}
