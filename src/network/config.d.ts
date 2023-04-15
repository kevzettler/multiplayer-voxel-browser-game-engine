declare namespace _default {
  namespace signalHub {
    export { SIGNALHUB_URL as url };
  }
  namespace socketIO {
    export { SOCKETIO_URL as url };
    export { SOCKETIO_PORT as port };
    export { SOCKETIO_HOST as host };
  }
  namespace simplePeer {
    const initiator: boolean;
    const trickle: boolean;
    namespace channelConfig {
      const ordered: boolean;
      const maxRetransmits: number;
    }
    namespace config {
      const iceServers: ({
        urls: string;
        username?: undefined;
        credential?: undefined;
      } | {
        urls: string;
        username: string;
        credential: any;
      })[];
    }
  }
}
export default _default;
declare const SIGNALHUB_URL: string;
declare const SOCKETIO_URL: string;
declare const SOCKETIO_PORT: any;
declare const SOCKETIO_HOST: any;
