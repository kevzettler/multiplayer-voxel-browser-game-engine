declare module 'signalhub' {
  import { EventEmitter } from 'events';

  class Hub {
    broadcast(serverName: string, payload: any): void;
    subscribe(channelName: string): EventEmitter;
  }

  export default function(serverName: string, urls: string[]): Hub
}
